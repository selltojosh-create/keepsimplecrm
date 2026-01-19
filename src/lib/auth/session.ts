import { cookies } from 'next/headers';
import { cache } from 'react';
import { lucia } from './lucia';
import { db } from '@/lib/db';
import { users, organizations, teams, memberships, teamMemberships } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { User, Session } from 'lucia';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  isPlatformOwner: boolean;
  isActive: boolean;
}

export interface SessionData {
  user: SessionUser;
  session: Session;
  activeOrganization: typeof organizations.$inferSelect | null;
  activeTeam: typeof teams.$inferSelect | null;
  membership: typeof memberships.$inferSelect | null;
  teamMembership: typeof teamMemberships.$inferSelect | null;
}

export const getSession = cache(async (): Promise<SessionData | null> => {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;

  if (!sessionId) {
    return null;
  }

  const result = await lucia.validateSession(sessionId);

  if (!result.session || !result.user) {
    return null;
  }

  // Refresh session cookie if needed
  if (result.session.fresh) {
    const sessionCookie = lucia.createSessionCookie(result.session.id);
    cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
  }

  // Get active organization and team
  let activeOrganization = null;
  let activeTeam = null;
  let membership = null;
  let teamMembership = null;

  if (result.session.activeOrganizationId) {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, result.session.activeOrganizationId))
      .limit(1);
    activeOrganization = org || null;

    if (activeOrganization) {
      const [mem] = await db
        .select()
        .from(memberships)
        .where(
          and(
            eq(memberships.userId, result.user.id),
            eq(memberships.organizationId, activeOrganization.id),
            eq(memberships.isActive, true)
          )
        )
        .limit(1);
      membership = mem || null;
    }
  }

  if (result.session.activeTeamId) {
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, result.session.activeTeamId))
      .limit(1);
    activeTeam = team || null;

    if (activeTeam) {
      const [teamMem] = await db
        .select()
        .from(teamMemberships)
        .where(
          and(
            eq(teamMemberships.userId, result.user.id),
            eq(teamMemberships.teamId, activeTeam.id),
            eq(teamMemberships.isActive, true)
          )
        )
        .limit(1);
      teamMembership = teamMem || null;
    }
  }

  return {
    user: result.user as SessionUser,
    session: result.session,
    activeOrganization,
    activeTeam,
    membership,
    teamMembership,
  };
});

export async function createSession(userId: string, organizationId?: string, teamId?: string) {
  const session = await lucia.createSession(userId, {
    activeOrganizationId: organizationId || null,
    activeTeamId: teamId || null,
  });
  const sessionCookie = lucia.createSessionCookie(session.id);
  const cookieStore = await cookies();
  cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
  return session;
}

export async function invalidateSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value;

  if (sessionId) {
    await lucia.invalidateSession(sessionId);
  }

  const blankCookie = lucia.createBlankSessionCookie();
  cookieStore.set(blankCookie.name, blankCookie.value, blankCookie.attributes);
}

export async function updateSessionContext(organizationId: string | null, teamId: string | null) {
  const session = await getSession();
  if (!session) return null;

  // Invalidate current session and create new one with updated context
  await lucia.invalidateSession(session.session.id);

  const newSession = await lucia.createSession(session.user.id, {
    activeOrganizationId: organizationId,
    activeTeamId: teamId,
  });

  const sessionCookie = lucia.createSessionCookie(newSession.id);
  const cookieStore = await cookies();
  cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

  return newSession;
}
