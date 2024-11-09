import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { auth } from "../../../../../../auth";
import { MemberStatus, Role } from "@prisma/client";

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

  if (!projectId) {
    return NextResponse.json(
      { success: false, message: "Project ID is required" },
      { status: 400 }
    );
  }

  try {
    const whereCondition = {
      projectId,
      role: Role.editor,
      status: MemberStatus.accepted,
      ...(editorId && { userId: editorId }),
    };

    const editors = await prisma.member.findMany({
      where: whereCondition,
      select: {
        id: true,
        permissions: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
      }
    });

    if (editorId && editors.length === 0) {
      return NextResponse.json(
        { success: false, message: "Editor not found in this project" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: editors,
    });

  } catch (error) {
    console.error("Error fetching project editors:", error);
    return NextResponse.json(
      { success: false, message: "Error fetching project editors" },
      { status: 500 }
    );
  }
}