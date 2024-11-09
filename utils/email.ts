import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEditorSubmissionEmail({
  youtuberEmail,
  projectName,
  editorName,
}: {
  youtuberEmail: string;
  projectName: string;
  editorName: string;
}) {
  try {
    await resend.emails.send({
      from: 'Your App <notifications@yourapp.com>',
      to: youtuberEmail,
      subject: `${projectName}: Editor has submitted their work`,
      html: `
        <h2>New Submission Alert</h2>
        <p>Hello,</p>
        <p>${editorName} has submitted their edited video for project "${projectName}".</p>
        <p>You can now review their work in the project dashboard.</p>
      `,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
} 