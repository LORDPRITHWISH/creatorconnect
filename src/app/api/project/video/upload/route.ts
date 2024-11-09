import { NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { prisma } from "../../../../../../lib/prisma";
import { google } from "googleapis";
import { S3 } from "@aws-sdk/client-s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";

// Initialize S3 client
const s3 = new S3({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function getVideoFromS3(filename: string): Promise<Readable> {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: filename,
  });

  const response = await s3.send(command);
  if (!response.Body) {
    throw new Error("Failed to get video from S3");
  }
  
  return response.Body as Readable;
}

async function getAuthenticatedYouTube(user: { access_token: string | null, refresh_token: string | null }) {
  if (!user.access_token) {
    throw new Error("No access token available");
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: user.access_token,
    refresh_token: user.refresh_token
  });
  
  return google.youtube({ version: 'v3', auth: oauth2Client });
}

export async function POST(req: Request) {
  let videoId: string;

  try {
    ({ videoId } = await req.json());
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get video details
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        Project: {
          include: {
            Owner: {
              select: {
                id: true,
                access_token: true,
                refresh_token: true,
              }
            }
          }
        }
      }
    });

    if (!video || !video.Project.Owner.access_token || !video.filename) {
      return NextResponse.json(
        { error: "Video not found, no YouTube access, or no filename" }, 
        { status: 404 }
      );
    }

    // Verify video is approved
    if (!video.isApproved) {
      return NextResponse.json({ error: "Video not approved" }, { status: 400 });
    }

    // Get video stream from S3
    const videoStream = await getVideoFromS3(video.filename);

    // Initialize YouTube API with stored tokens
    const youtube = await getAuthenticatedYouTube(video.Project.Owner);

    // Update video status to uploading
    await prisma.video.update({
      where: { id: videoId },
      data: { uploadStatus: 'uploading' },
    });

    // Upload video to YouTube
    const res = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: video.title,
          description: video.description || '',
          tags: video.tags,
          categoryId: video.category,
          defaultLanguage: video.defaultLanguage,
        },
        status: {
          privacyStatus: video.privacyStatus || 'private',
          selfDeclaredMadeForKids: video.selfDeclaredMadeForKids || false,
          publishAt: video.publishAt?.toISOString(),
        },
      },
      media: {
        body: videoStream,
      },
    });

    // Update video with YouTube data
    const updatedVideo = await prisma.video.update({
      where: { id: videoId },
      data: {
        channelId: res.data.snippet?.channelId,
        uploadStatus: 'completed',
      },
    });

    return NextResponse.json(updatedVideo);

  } catch (error) {
    console.error(error);
    
    // Update video status if upload fails
    if (error instanceof Error) {
      await prisma.video.update({
        where: { id: videoId },
        data: {
          uploadStatus: 'failed',
          failureReason: error.message,
        },
      });
    }

    return NextResponse.json(
      { error: "Failed to upload video" },
      { status: 500 }
    );
  }
} 