import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { organizationEmailSettings, memberships } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const emailSettingsSchema = z.object({
  fromName: z.string().min(1).max(255),
  fromEmail: z.string().email(),
  replyToEmail: z.string().email().nullable().optional(),
  provider: z.enum(['resend', 'sendgrid', 'postmark', 'ses']),
  providerApiKey: z.string().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session?.activeOrganization) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [settings] = await db
    .select()
    .from(organizationEmailSettings)
    .where(eq(organizationEmailSettings.organizationId, session.activeOrganization.id))
    .limit(1);

  return NextResponse.json(settings || null);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.activeOrganization) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if current user is admin
  const [currentUserMembership] = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.organizationId, session.activeOrganization.id),
        eq(memberships.userId, session.user.id)
      )
    )
    .limit(1);

  if (
    !currentUserMembership ||
    currentUserMembership.orgRole !== 'admin'
  ) {
    return NextResponse.json(
      { error: 'Only admins can configure email settings' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const result = emailSettingsSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: result.error.flatten() },
      { status: 400 }
    );
  }

  // Check if settings already exist
  const [existing] = await db
    .select()
    .from(organizationEmailSettings)
    .where(eq(organizationEmailSettings.organizationId, session.activeOrganization.id))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: 'Email settings already exist. Use PATCH to update.' },
      { status: 400 }
    );
  }

  const [settings] = await db
    .insert(organizationEmailSettings)
    .values({
      organizationId: session.activeOrganization.id,
      fromName: result.data.fromName,
      fromEmail: result.data.fromEmail,
      replyToEmail: result.data.replyToEmail,
      provider: result.data.provider,
      providerApiKey: result.data.providerApiKey,
    })
    .returning();

  return NextResponse.json(settings, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session?.activeOrganization) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if current user is admin
  const [currentUserMembership] = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.organizationId, session.activeOrganization.id),
        eq(memberships.userId, session.user.id)
      )
    )
    .limit(1);

  if (
    !currentUserMembership ||
    currentUserMembership.orgRole !== 'admin'
  ) {
    return NextResponse.json(
      { error: 'Only admins can configure email settings' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const result = emailSettingsSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: result.error.flatten() },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = {
    fromName: result.data.fromName,
    fromEmail: result.data.fromEmail,
    replyToEmail: result.data.replyToEmail,
    provider: result.data.provider,
    updatedAt: new Date(),
  };

  // Only update API key if provided
  if (result.data.providerApiKey) {
    updateData.providerApiKey = result.data.providerApiKey;
  }

  const [settings] = await db
    .update(organizationEmailSettings)
    .set(updateData)
    .where(eq(organizationEmailSettings.organizationId, session.activeOrganization.id))
    .returning();

  if (!settings) {
    // Create if doesn't exist
    const [newSettings] = await db
      .insert(organizationEmailSettings)
      .values({
        organizationId: session.activeOrganization.id,
        fromName: result.data.fromName,
        fromEmail: result.data.fromEmail,
        replyToEmail: result.data.replyToEmail,
        provider: result.data.provider,
        providerApiKey: result.data.providerApiKey,
      })
      .returning();

    return NextResponse.json(newSettings);
  }

  return NextResponse.json(settings);
}
