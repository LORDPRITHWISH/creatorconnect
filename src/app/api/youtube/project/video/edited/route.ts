import { NextResponse } from "next/server";
import { prisma } from "../../../../../../../lib/prisma";
import { auth } from "../../../../../../../auth";
import { MemberStatus } from "@prisma/client";
import { 
  S3Client, 
  CreateMultipartUploadCommand,
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

type Permission = {
  resource: string;
  field: string;
  access: 'read' | 'write';
};

function parsePermission(permission: string): Permission {
  const [resourceField, access] = permission.split(':');
  const [resource, field] = resourceField.split('.');
  return { resource, field, access: access as 'read' | 'write' };
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { projectId, videoId, filename, contentType, parts } = await request.json();

    if (!projectId || !videoId || !filename || !contentType || !parts) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check editor permissions
    const editorMember = await prisma.member.findFirst({
      where: {
        projectId,
        userId: session.user?.id,
        status: MemberStatus.accepted,
      },
      select: {
        permissions: true,
      },
    });

    if (!editorMember) {
      return NextResponse.json(
        { success: false, message: "Not authorized for this project" },
        { status: 403 }
      );
    }

    // Verify upload permission
    const parsedPermissions = editorMember.permissions.map(parsePermission);
    const canUpload = parsedPermissions.some(
      perm => perm.resource === 'video' && perm.field === 'upload' && perm.access === 'write'
    );

    if (!canUpload) {
      return NextResponse.json(
        { success: false, message: "No permission to upload edited video" },
        { status: 403 }
      );
    }

    // Generate unique S3 key
    const key = `edited-videos/${projectId}/${videoId}/${Date.now()}-${filename}`;

    // Create multipart upload
    const createMultipartUpload = new CreateMultipartUploadCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      ContentType: contentType,
    });

    const multipartUpload = await s3Client.send(createMultipartUpload);
    const uploadId = multipartUpload.UploadId;

    // Generate presigned URLs for each part
    const presignedUrls = await Promise.all(
      Array.from({ length: parts }, (_, index) => index + 1).map(async (partNumber) => {
        const command = new UploadPartCommand({
          Bucket: process.env.S3_BUCKET_NAME!,
          Key: key,
          UploadId: uploadId,
          PartNumber: partNumber,
        });

        const signedUrl = await getSignedUrl(s3Client, command, {
          expiresIn: 3600,
        });

        return {
          signedUrl,
          partNumber,
        };
      })
    );

    // Generate S3 URL for the final file
    const s3Url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    // Update database with pending status
    await prisma.video.update({
      where: {
        id: videoId,
        projectId,
      },
      data: {
        uploadStatus: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        uploadId,
        key,
        presignedUrls,
        s3Url,
      },
    });

  } catch (error) {
    console.error("Error initiating multipart upload:", error);
    return NextResponse.json(
      { success: false, message: "Error initiating upload" },
      { status: 500 }
    );
  }
}

// Endpoint to complete multipart upload
export async function PUT(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { projectId, videoId, uploadId, key, parts } = await request.json();

    const completeCommand = new CompleteMultipartUploadCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts,
      },
    });

    await s3Client.send(completeCommand);

    // Update project and video records
    await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        editedVideoId: videoId,
      },
    });

    await prisma.video.update({
      where: {
        id: videoId,
        projectId,
      },
      data: {
        url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
        uploadStatus: 'completed',
      },
    });

    return NextResponse.json({
      success: true,
      message: "Upload completed successfully",
    });

  } catch (error) {
    console.error("Error completing multipart upload:", error);
    return NextResponse.json(
      { success: false, message: "Error completing upload" },
      { status: 500 }
    );
  }
} 