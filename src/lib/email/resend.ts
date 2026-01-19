import { Resend } from 'resend';

let resendClient: Resend | null = null;

export const getResendClient = () => {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('RESEND_API_KEY not set - email sending will be simulated');
      return null;
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
};

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  const client = getResendClient();

  if (!client) {
    // Simulate sending in development without API key
    console.log('[Email Simulated]', {
      to: options.to,
      subject: options.subject,
    });
    return { success: true, id: `simulated-${Date.now()}` };
  }

  try {
    const result = await client.emails.send({
      from: options.from || process.env.EMAIL_FROM || 'noreply@keepsimplecrm.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// Template variable replacement
export function parseEmailTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, value);
  }

  return result;
}
