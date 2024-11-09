import { NextResponse } from "next/server";
import { prisma } from "../../../../../../../lib/prisma";
import { auth } from "../../../../../../../auth";
import { MemberStatus } from "@prisma/client";

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

export async function PUT(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { projectId, videoId, updates } = await request.json();

    if (!projectId || !videoId || !updates) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
    );
    }

    // Get editor's permissions for this project
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

    // Parse permissions
    const parsedPermissions = editorMember.permissions.map(parsePermission);
    
    // Filter updates based on write permissions
    const allowedUpdates: Record<string, any> = {};
    
    Object.entries(updates).forEach(([field, value]) => {
      const hasWritePermission = parsedPermissions.some(
        perm => 
          perm.resource === 'video' && 
          perm.field === field && 
          perm.access === 'write'
      );

      if (hasWritePermission) {
        allowedUpdates[field] = value;
      }
    });

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json(
        { success: false, message: "No permitted fields to update" },
        { status: 403 }
      );
    }

    // Update only the permitted fields
    const updatedVideo = await prisma.video.update({
      where: {
        id: videoId,
        projectId,
      },
      data: allowedUpdates,
    });

    return NextResponse.json({
      success: true,
      message: "Video updated successfully",
      data: {
        updatedFields: Object.keys(allowedUpdates),
        video: updatedVideo,
      },
    });

  } catch (error) {
    console.error("Error updating video:", error);
    return NextResponse.json(
      { success: false, message: "Error updating video" },
      { status: 500 }
    );
  }
} 