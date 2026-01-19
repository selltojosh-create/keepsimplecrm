import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { organizations, memberships, teams, teamMemberships } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { TooltipProvider } from '@/components/ui/tooltip';

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // Get user's organizations
  let userOrganizations: Array<{ id: string; name: string; slug: string }> = [];

  if (session.user.isPlatformOwner) {
    // Platform owner can see all organizations
    userOrganizations = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
      })
      .from(organizations)
      .where(eq(organizations.isActive, true));
  } else {
    // Regular users only see their organizations
    const userMemberships = await db
      .select({ organizationId: memberships.organizationId })
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, session.user.id),
          eq(memberships.isActive, true)
        )
      );

    if (userMemberships.length > 0) {
      const orgIds = userMemberships.map((m) => m.organizationId);
      userOrganizations = await db
        .select({
          id: organizations.id,
          name: organizations.name,
          slug: organizations.slug,
        })
        .from(organizations)
        .where(
          and(
            inArray(organizations.id, orgIds),
            eq(organizations.isActive, true)
          )
        );
    }
  }

  // Get user's teams in the current organization
  let userTeams: Array<{ id: string; name: string; slug: string }> = [];

  if (session.activeOrganization) {
    if (session.user.isPlatformOwner) {
      // Platform owner can see all teams in the org
      userTeams = await db
        .select({
          id: teams.id,
          name: teams.name,
          slug: teams.slug,
        })
        .from(teams)
        .where(
          and(
            eq(teams.organizationId, session.activeOrganization.id),
            eq(teams.isActive, true)
          )
        );
    } else {
      // Regular users only see their teams
      const userTeamMemberships = await db
        .select({ teamId: teamMemberships.teamId })
        .from(teamMemberships)
        .where(
          and(
            eq(teamMemberships.userId, session.user.id),
            eq(teamMemberships.organizationId, session.activeOrganization.id),
            eq(teamMemberships.isActive, true)
          )
        );

      if (userTeamMemberships.length > 0) {
        const teamIds = userTeamMemberships.map((m) => m.teamId);
        userTeams = await db
          .select({
            id: teams.id,
            name: teams.name,
            slug: teams.slug,
          })
          .from(teams)
          .where(
            and(inArray(teams.id, teamIds), eq(teams.isActive, true))
          );
      }
    }
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header
            session={session}
            organizations={userOrganizations}
            teams={userTeams}
          />
          <main className="relative z-10 flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
