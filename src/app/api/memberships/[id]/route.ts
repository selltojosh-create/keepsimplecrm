import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { memberships } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updateMembershipSchema = z.object({
  orgRole: z.enum(['admin', 'employee']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.activeOrganization) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Get current user's membership to check permissions
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

  if (!currentUserMembership || currentUserMembership.orgRole !== 'admin') {
    return NextResponse.json(
      { error: 'Only admins can manage members' },
      { status: 403 }
    );
  }

  // Get the target membership
  const [targetMembership] = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.id, id),
        eq(memberships.organizationId, session.activeOrganization.id)
      )
    )
    .limit(1);

  if (!targetMembership) {
    return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
  }

  // Cannot modify own role
  if (targetMembership.userId === session.user.id) {
    return NextResponse.json(
      { error: 'Cannot modify your own role' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const result = updateMembershipSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: result.error.flatten() },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(memberships)
    .set({ orgRole: result.data.orgRole, updatedAt: new Date() })
    .where(eq(memberships.id, id))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.activeOrganization) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Get current user's membership to check permissions
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

  if (!currentUserMembership || currentUserMembership.orgRole !== 'admin') {
    return NextResponse.json(
      { error: 'Only admins can remove members' },
      { status: 403 }
    );
  }

  // Get the target membership
  const [targetMembership] = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.id, id),
        eq(memberships.organizationId, session.activeOrganization.id)
      )
    )
    .limit(1);

  if (!targetMembership) {
    return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
  }

  // Cannot remove yourself
  if (targetMembership.userId === session.user.id) {
    return NextResponse.json(
      { error: 'Cannot remove yourself' },
      { status: 403 }
    );
  }

  await db.delete(memberships).where(eq(memberships.id, id));

  return NextResponse.json({ success: true });
}
