import { NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { prisma } from "../../../../../../lib/prisma";


export async function POST(req: Request) {
  try {
    const { videoId, isApproved, message } = await req.json();
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get video and check project ownership
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: { Project: true },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (video.Project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update video approval status
    const updatedVideo = await prisma.video.update({
      where: { id: videoId },
      data: {
        isApproved,
        failureReason: !isApproved ? message : null, // Store disapproval message
      },
    });

    return NextResponse.json(updatedVideo);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 