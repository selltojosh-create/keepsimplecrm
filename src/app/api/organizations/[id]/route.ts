import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { organizations, memberships } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Check membership
  const [membership] = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.organizationId, id),
        eq(memberships.userId, session.user.id)
      )
    )
    .limit(1);

  if (!membership) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const [organization] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, id))
    .limit(1);

  if (!organization) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(organization);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Check membership with admin role
  const [membership] = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.organizationId, id),
        eq(memberships.userId, session.user.id)
      )
    )
    .limit(1);

  if (!membership || membership.orgRole !== 'admin') {
    return NextResponse.json(
      { error: 'Only admins can update organization settings' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const result = updateOrganizationSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { name, slug } = result.data;

  // Check slug uniqueness if changing
  if (slug) {
    const [existingOrg] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, slug))
      .limit(1);

    if (existingOrg && existingOrg.id !== id) {
      return NextResponse.json(
        { error: 'This URL slug is already taken' },
        { status: 400 }
      );
    }
  }

  const [updated] = await db
    .update(organizations)
    .set({
      ...(name && { name }),
      ...(slug && { slug }),
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, id))
    .returning();

  return NextResponse.json(updated);
}
