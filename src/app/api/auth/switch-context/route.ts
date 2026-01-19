import { NextResponse } from 'next/server';
import { getSession, updateSessionContext } from '@/lib/auth';
import { db } from '@/lib/db';
import { memberships, teamMemberships, teams } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { organizationId, teamId } = body;

    // If switching organization
    if (organizationId !== undefined) {
      if (organizationId) {
        // Verify user has access to this organization
        const [membership] = await db
          .select()
          .from(memberships)
          .where(
            and(
              eq(memberships.userId, session.user.id),
              eq(memberships.organizationId, organizationId),
              eq(memberships.isActive, true)
            )
          )
          .limit(1);

        if (!membership && !session.user.isPlatformOwner) {
          return NextResponse.json(
            { error: 'Access denied to this organization' },
            { status: 403 }
          );
        }

        // Get first team in this org for the user
        let newTeamId: string | null = null;
        const [teamMembership] = await db
          .select({ team: teams })
          .from(teamMemberships)
          .innerJoin(teams, eq(teams.id, teamMemberships.teamId))
          .where(
            and(
              eq(teamMemberships.userId, session.user.id),
              eq(teamMemberships.organizationId, organizationId),
              eq(teamMemberships.isActive, true)
            )
          )
          .limit(1);

        if (teamMembership) {
          newTeamId = teamMembership.team.id;
        }

        await updateSessionContext(organizationId, newTeamId);
      } else {
        // Clear organization context
        await updateSessionContext(null, null);
      }
    }

    // If switching team within current organization
    if (teamId !== undefined && session.activeOrganization) {
      if (teamId) {
        // Verify user has access to this team
        const [teamMembership] = await db
          .select()
          .from(teamMemberships)
          .where(
            and(
              eq(teamMemberships.userId, session.user.id),
              eq(teamMemberships.teamId, teamId),
              eq(teamMemberships.isActive, true)
            )
          )
          .limit(1);

        if (!teamMembership && !session.user.isPlatformOwner) {
          return NextResponse.json(
            { error: 'Access denied to this team' },
            { status: 403 }
          );
        }
      }

      await updateSessionContext(session.activeOrganization.id, teamId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Switch context error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
