import { NextResponse } from "next/server";
import { prisma } from "../../../../../../../lib/prisma";
import { auth } from "../../../../../../../auth";
import { MemberStatus } from "@prisma/client";

export async function PUT(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { projectId, editorId, permissions } = await request.json();

    if (!projectId || !editorId || !permissions) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify if the current user is the project owner
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: session.user?.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, message: "Unauthorized or project not found" },
        { status: 403 }
      );
    }

    // Update editor permissions
    const updatedMember = await prisma.member.updateMany({
      where: {
        projectId,
        userId: editorId,
        status: MemberStatus.accepted,
      },
      data: {
        permissions,
      },
    });

    if (updatedMember.count === 0) {
      return NextResponse.json(
        { success: false, message: "Editor not found or not accepted" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Permissions updated successfully",
    });

  } catch (error) {
    console.error("Error updating editor permissions:", error);
    return NextResponse.json(
      { success: false, message: "Error updating permissions" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch current permissions
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const editorId = searchParams.get("editorId");

  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  if (!projectId || !editorId) {
    return NextResponse.json(
      { success: false, message: "Project ID and Editor ID are required" },
      { status: 400 }
    );
  }

  try {
    const member = await prisma.member.findFirst({
      where: {
        projectId,
        userId: editorId,
        status: MemberStatus.accepted,
      },
      select: {
        permissions: true,
        User: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    });

    if (!member) {
      return NextResponse.json(
        { success: false, message: "Editor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: member,
    });

  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json(
      { success: false, message: "Error fetching permissions" },
      { status: 500 }
    );
  }
} 