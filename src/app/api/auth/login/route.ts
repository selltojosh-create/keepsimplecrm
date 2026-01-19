import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, memberships, teamMemberships, teams } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyPassword, createSession } from '@/lib/auth';
import { loginSchema } from '@/lib/validations/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Your account has been deactivated' },
        { status: 401 }
      );
    }

    // Verify password
    const validPassword = await verifyPassword(password, user.passwordHash);

    if (!validPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get user's first organization and team for initial context
    const [membership] = await db
      .select()
      .from(memberships)
      .where(and(eq(memberships.userId, user.id), eq(memberships.isActive, true)))
      .limit(1);

    let organizationId: string | undefined;
    let teamId: string | undefined;

    if (membership) {
      organizationId = membership.organizationId;

      // Get first team in this org
      const [teamMembership] = await db
        .select({ team: teams })
        .from(teamMemberships)
        .innerJoin(teams, eq(teams.id, teamMemberships.teamId))
        .where(
          and(
            eq(teamMemberships.userId, user.id),
            eq(teamMemberships.organizationId, organizationId),
            eq(teamMemberships.isActive, true)
          )
        )
        .limit(1);

      if (teamMembership) {
        teamId = teamMembership.team.id;
      }
    }

    // Create session
    await createSession(user.id, organizationId, teamId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
