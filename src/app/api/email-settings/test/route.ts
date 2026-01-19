import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { organizationEmailSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';
import { z } from 'zod';

const testEmailSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.activeOrganization) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [settings] = await db
    .select()
    .from(organizationEmailSettings)
    .where(eq(organizationEmailSettings.organizationId, session.activeOrganization.id))
    .limit(1);

  if (!settings) {
    return NextResponse.json(
      { error: 'Email settings not configured' },
      { status: 400 }
    );
  }

  const body = await request.json();
  const result = testEmailSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid email address' },
      { status: 400 }
    );
  }

  try {
    await sendEmail({
      to: result.data.email,
      subject: `Test Email from ${settings.fromName}`,
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from your CRM.</p>
        <p>If you received this email, your email settings are configured correctly.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          Sent from ${settings.fromName} &lt;${settings.fromEmail}&gt;
        </p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to send test email:', error);
    return NextResponse.json(
      { error: 'Failed to send test email. Check your email provider settings.' },
      { status: 500 }
    );
  }
}
