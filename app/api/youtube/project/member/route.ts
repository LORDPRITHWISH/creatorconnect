import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { MemberStatus } from "@prisma/client";
import { auth } from "../../../../../auth";

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const memberId = searchParams.get("memberId");

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
  if (!memberId) {
    return NextResponse.json(
      { success: false, message: "Member ID is missing" },
      { status: 400 }
    );
  }
  try {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      select: {
        ownerId: true,
      },
    });
    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    if (project.ownerId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const projectMember = await prisma.member.findFirst({
      where: {
        userId: memberId,
        projectId,
        status: "accepted",
      },
    });
    if (!projectMember) {
      return NextResponse.json(
        { success: false, message: "Member not found" },
        { status: 404 }
      );
    }
    await prisma.member.delete({
      where: {
        id: projectMember.id,
      },
    });
    return NextResponse.json(
      {
        success: true,
        data: memberId,
        message: "Member removed successfully",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error deleting member from the project", error);
    return NextResponse.json(
      { success: false, message: "Error deleting member from the project" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const status =
    (searchParams.get("status") as MemberStatus) || MemberStatus.accepted;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");
  const skip = (page - 1) * limit;

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

  try {
    const projectMembers = await prisma.member.findMany({
      skip: skip,
      take: limit,
      where: {
        projectId,
        status,
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        permissions: true,
        User: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
    const totalMembers = await prisma.member.count();

    return NextResponse.json({
      success: true,
      data: {
        projectMembers,
        totalMembers,
        totalPages: Math.ceil(totalMembers / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching project members", error);
    return NextResponse.json(
      { success: false, message: "Error fetching project members" },
      { status: 500 }
    );
  }
}
