import React from "react";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Button,
  Link,
} from "@react-email/components";

interface ProjectInviteEmailProps {
  inviteUrl: string;
  projectName: string;
  role: "youtuber" | "editor";
}

const ProjectInviteEmail: React.FC<ProjectInviteEmailProps> = ({
  inviteUrl,
  projectName,
  role,
}) => {
  return (
    <Html>
      <Head />
      <Preview>Join our project on ezytodo</Preview>
      <Body style={{ backgroundColor: "#f3f4f6", fontFamily: "Arial, sans-serif" }}>
        <Container style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "24px",
          maxWidth: "600px",
          margin: "40px auto"
        }}>
          <Section>
            <Text style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "16px", color: "#1f2937" }}>
              You're Invited to Collaborate on the Project "{projectName}"
            </Text>
            <Text style={{ color: "#4b5563", marginBottom: "16px" }}>
              You've been invited to collaborate on the project "{projectName}"
              as an "{role}" on Viewtuber. It's a great place to work together
              and manage tasks efficiently.
            </Text>
            <Text style={{ color: "#4b5563", marginBottom: "24px" }}>
              Click the button below to accept the invitation and get started:
            </Text>
            <Button
              style={{
                backgroundColor: "#2563eb",
                color: "#ffffff",
                borderRadius: "6px",
                fontWeight: "600",
                fontSize: "18px",
                padding: "12px 20px",
                textDecoration: "none",
                display: "inline-block",
              }}
              href={inviteUrl}
            >
              Join Project
            </Button>
            <Text>or copy and paste the link</Text>
            <Link style={{ color: "#2563eb", textDecoration: "underline" }}>{inviteUrl}</Link>
            <Text style={{ color: "#6b7280", marginTop: "24px" }}>
              If you didn’t expect this invitation, feel free to ignore this
              email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ProjectInviteEmail;
