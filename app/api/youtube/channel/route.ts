import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "../../../../lib/prisma";

export async function GET(req: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }
  try {
    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
      {
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`,
          accept: "application/json",
        },
      }
    );
    console.log(response);

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch channel details" },
        { status: 500 }
      );
    }
    const channelDetails = await response.json();
    return NextResponse.json({
      success: true,
      channel: channelDetails.items[0],
    });
  } catch (error) {
    console.error("Error fetching channel details", error);
    return NextResponse.json(
      { success: false, message: "Error fetching channel details" },
      { status: 500 }
    );
  }
}
