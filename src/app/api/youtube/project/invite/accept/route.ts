import { NextResponse } from "next/server";
import { prisma } from "../../../../../../../lib/prisma";
import { auth } from "../../../../../../../auth";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json(
      { success: false, message: "Project ID is required" },
      { status: 400 }
    );
  }

  const { email, inviteCode } = await request.json();

  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Find the pending invitation
    const invitation = await prisma.member.findFirst({
      where: {
        projectId: projectId,
        email: email,
        inviteCode: inviteCode,
        status: "pending",
        inviteCodeExpiry: {
          gt: new Date(), // Check if invite hasn't expired
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired invitation" },
        { status: 400 }
      );
    }

    // Update the member status to accepted
    await prisma.member.update({
      where: {
        id: invitation.id,
      },
      data: {
        status: "accepted",
        userId: session.user.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Project invitation accepted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error accepting project invitation", error);
    return NextResponse.json(
      { success: false, message: "Error accepting project invitation" },
      { status: 500 }
    );
  }
} 