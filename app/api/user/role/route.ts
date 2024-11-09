import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../../auth";

import { Role } from "@prisma/client";

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");

  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      {
        status: 400,
      }
    );
  }
  if (!role) {
    return NextResponse.json(
      { success: false, message: "Missing role" },
      {
        status: 400,
      }
    );
  }
  const user = session.user;
  try {
    const updatedUser = await prisma.user.update({
      where: { id: user.id as string },
      data: { role: role as Role },
    });

    return NextResponse.json(
      {
        success: true,
        user: updatedUser,
        message: "user role added successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user role", error);
    return NextResponse.json(
      { success: false, message: "Error updating user" },
      { status: 500 }
    );
  }
}
