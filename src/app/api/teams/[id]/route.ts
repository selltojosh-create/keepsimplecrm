import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { teams, teamMemberships, memberships } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.activeOrganization) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

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

  if (!currentUserMembership || currentUserMembership.orgRole !== 'admin') {
    return NextResponse.json(
      { error: 'Only admins can delete teams' },
      { status: 403 }
    );
  }

  // Check team belongs to this organization
  const [team] = await db
    .select()
    .from(teams)
    .where(
      and(
        eq(teams.id, id),
        eq(teams.organizationId, session.activeOrganization.id)
      )
    )
    .limit(1);

  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  // Delete team memberships first
  await db.delete(teamMemberships).where(eq(teamMemberships.teamId, id));

  // Delete team
  await db.delete(teams).where(eq(teams.id, id));

  return NextResponse.json({ success: true });
}
