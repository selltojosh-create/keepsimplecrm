import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { teams, memberships } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const createTeamSchema = z.object({
  name: z.string().min(1).max(255),
});

export async function GET() {
  const session = await getSession();
  if (!session?.activeOrganization) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orgTeams = await db
    .select()
    .from(teams)
    .where(eq(teams.organizationId, session.activeOrganization.id));

  return NextResponse.json(orgTeams);
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

  if (!currentUserMembership || currentUserMembership.orgRole !== 'admin') {
    return NextResponse.json(
      { error: 'Only admins can create teams' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const result = createTeamSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: result.error.flatten() },
      { status: 400 }
    );
  }

  // Generate slug from name
  const slug = result.data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const [team] = await db
    .insert(teams)
    .values({
      organizationId: session.activeOrganization.id,
      name: result.data.name,
      slug,
    })
    .returning();

  return NextResponse.json(team, { status: 201 });
}
