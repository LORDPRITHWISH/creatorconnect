import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { resend } from "../../../../../../lib/resend";
import ProjectInviteEmail from "../../../../../emails/ProjectInviteEmail";
import { auth } from "../../../../../auth";

import { nanoid } from "nanoid";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const { email, role, permissions } = await request.json();

  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }
  if (!email) {
    return NextResponse.json(
      { success: false, message: "Email is missing" },
      { status: 400 }
    );
  }
  if (!role) {
    return NextResponse.json(
      { success: false, message: "Role is missing" },
      { status: 400 }
    );
  }
  if (!projectId) {
    return NextResponse.json(
      { success: false, message: "Project Id is missing" },
      { status: 400 }
    );
  }

  try {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        ownerId: session.user.id,
      },
      include: {
        members: {
          select: {
            email: true,
            role: true,
            status: true,
            inviteCode: true,
            inviteCodeExpiry: true,
          },
        },
      },
    });
    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    const member = project.members.find((member) => member.email === email);
    if (member?.status === "accepted") {
      return NextResponse.json(
        {
          success: false,
          message: "User is already a member of the project",
        },
        { status: 400 }
      );
    }
    if (
      member?.status === "pending" &&
      member?.inviteCodeExpiry! > new Date()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "User is already invited to the project",
        },
        { status: 400 }
      );
    }
    const invitecode = nanoid(10);
    const invitecodeExpiry = new Date(Date.now() + 3600000);
    const inviteUrl = `${process.env.BASE_URL}/project/${projectId}?invitecode=${invitecode}&email=${email}&role=${role}`;

    try {
      const sendProjectInviteEmail = await resend.emails.send({
        from: "Viewtuber <support@clikit.live>",
        to: email,
        subject: "Project Invitation",
        react: ProjectInviteEmail({
          inviteUrl,
          projectName: project.name,
          role,
        }),
      });
      if (!sendProjectInviteEmail.error) {
        await prisma.member.create({
          data: {
            projectId: projectId,
            email: email,
            role: role,
            status: "pending",
            inviteCode: invitecode,
            inviteCodeExpiry: invitecodeExpiry,
            permissions: permissions
              .split(",")
              .map((permission: string) => permission),
          },
        });
        return NextResponse.json(
          {
            success: true,
            message: "Invitition Email sent successfully",
          },
          { status: 200 }
        );
      }
    } catch (emailError) {
      console.error("Error sending project invite email", emailError);
      return NextResponse.json(
        { success: false, message: "Error sending project invite email" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error inviting user to the project", error);
    return NextResponse.json(
      { success: false, message: "Error inviting user to the project" },
      { status: 500 }
    );
  }
}
