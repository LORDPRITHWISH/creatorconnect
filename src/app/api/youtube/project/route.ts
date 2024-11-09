import { NextResponse } from "next/server";


import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "../../../../../auth";
import { s3Client } from "../../../../../lib/s3";
import { prisma } from "../../../../../lib/prisma";

export async function POST(request: Request) {
  if (request.method !== "POST") {
    return NextResponse.json(
      { success: false, message: "Method not allowed" },
      { status: 405 }
    );
  }
  const {
    name: projectName,
    description,
    requirements,
    deadline,
    filePartCount,
  } = await request.json();

  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  if (!projectName) {
    return NextResponse.json(
      {
        success: false,
        message: "Project name is missing",
      },
      {
        status: 400,
      }
    );
  }
  const user = session.user;
  try {
    let storageKey: string | undefined;
    let presignedUrls: string[] = [];
    let uploadId: string | undefined;

    if (filePartCount && filePartCount > 0) {
      storageKey = `${session.user.id}/projects/${projectName}-${Date.now()}`;
      const createMultiUpload = new CreateMultipartUploadCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: storageKey,
        ContentType: 'video/mp4',
      });

      const uploadResponse = await s3Client.send(createMultiUpload);
      uploadId = uploadResponse.UploadId;

      presignedUrls = await Promise.all(
        Array.from({ length: filePartCount }, async (_, index) => {
          const uploadPartCommand = new UploadPartCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: storageKey,
            PartNumber: index + 1,
            UploadId: uploadId,
          });
          return getSignedUrl(s3Client, uploadPartCommand, { expiresIn: 3600 });
        })
      );

      return NextResponse.json({
        success: true,
        uploadData: {
          presignedUrls,
          storageKey,
          uploadId,
        }
      });
    }

    const project = await prisma.project.create({
      data: {
        name: projectName,
        description: description ?? null,
        ownerId: user.id!,
        key: storageKey ?? null,
        requirements: requirements ?? null,
        deadline: deadline ?? null,
        Video: filePartCount ? {
          create: {
            title: projectName,
            uploadStatus: 'pending',
            publishAt: new Date(),
            url: `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${storageKey}`,
          }
        } : undefined,
      },
      include: {
        Video: true,
      }
    });        

    await prisma.member.create({
      data: {
        userId: session.user.id,
        projectId: project.id,
        role: "youtuber",
        status: "accepted",
        email: user.email!,
        permissions: ["all"],
      },
    });

    return NextResponse.json({
      success: true,
      project,
      message: "Project created successfully",
    });
  } catch (error) {
    console.error("Error creating the project", error);
    return NextResponse.json(
      { success: false, message: "Error creating the project" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const { name: projectName, description, requirements } = await request.json();

  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  if (!projectId || !projectName) {
    return NextResponse.json(
      { success: false, message: "Project ID or Project name is missing" },
      { status: 400 }
    );
  }
  const user = session.user;
  try {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 400 }
      );
    }
    if (project.ownerId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const updatedProject = await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        name: projectName,
        description: description ?? null,
      },
    });
    return NextResponse.json({
      success: true,
      project: updatedProject,
      message: "Project updated successfully",
    });
  } catch (error) {
    console.error("Error updating the project", error);
    return NextResponse.json(
      { success: false, message: "Error updating the project" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }
  if (!projectId) {
    return NextResponse.json(
      { success: false, message: "Project ID is missing" },
      { status: 400 }
    );
  }
  const user = session.user;

  try {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 400 }
      );
    }
    if (project.ownerId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    await prisma.project.delete({
      where: {
        id: projectId,
      },
    });
    return NextResponse.json({
      success: true,
      project: project.id,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting the project", error);
    return NextResponse.json(
      { success: false, message: "Error deleting the project" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }
  if (!projectId) {
    return NextResponse.json(
      { success: false, message: "Project ID is missing" },
      { status: 400 }
    );
  }
  const user = session.user;
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
      },
      include: {
        members: {
          select: {
            userId: true,
            role: true,
            status: true,
            email: true,
            permissions: true,
          },
        },
        Video: {
          select: {
            id: true,
            title: true,
            description: true,
            url: true,
            publishAt: true,
            thumbnail: true,
            uploadStatus: true,
            keywords: true,
            tags: true,
            category: true,
            privacyStatus: true,
            isApproved: true,
          },
        },
        Owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        success: true,
        project: project,
        message: "Project fetched successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching the project", error);
    return NextResponse.json(
      { success: false, message: "Error fetching the project" },
      { status: 500 }
    );
  }
}
