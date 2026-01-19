import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { memberships, users, teams, teamMemberships } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { TeamMembersList } from '@/components/settings/team-members-list';
import { InviteMemberDialog } from '@/components/settings/invite-member-dialog';
import { TeamsManager } from '@/components/settings/teams-manager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function TeamSettingsPage() {
  const session = await getSession();

  if (!session?.activeOrganization) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Select an organization to manage team members.
        </p>
      </div>
    );
  }

  const orgId = session.activeOrganization.id;

  // Get all members with their user info
  const members = await db
    .select({
      membership: memberships,
      user: users,
    })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(eq(memberships.organizationId, orgId));

  // Get all teams in the organization
  const orgTeams = await db
    .select()
    .from(teams)
    .where(eq(teams.organizationId, orgId));

  // Get team memberships for each team
  const teamsWithMembers = await Promise.all(
    orgTeams.map(async (team) => {
      const teamMembers = await db
        .select({
          teamMembership: teamMemberships,
          user: users,
        })
        .from(teamMemberships)
        .innerJoin(users, eq(teamMemberships.userId, users.id))
        .where(eq(teamMemberships.teamId, team.id));

      return {
        ...team,
        members: teamMembers,
      };
    })
  );

  const currentUserMembership = members.find(
    (m) => m.membership.userId === session.user.id
  );
  const canManage = currentUserMembership?.membership.orgRole === 'admin';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Manage who has access to this organization
            </CardDescription>
          </div>
          {canManage && <InviteMemberDialog />}
        </CardHeader>
        <CardContent>
          <TeamMembersList
            members={members}
            currentUserId={session.user.id}
            canManage={canManage}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Teams</CardTitle>
            <CardDescription>
              Organize members into teams for better collaboration
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <TeamsManager
            teams={teamsWithMembers}
            allMembers={members}
            canManage={canManage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
