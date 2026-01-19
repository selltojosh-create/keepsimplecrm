import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { emailTemplates, pipelineStages, pipelines, users, teamMemberships } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AutomationBuilder } from '@/components/automations/automation-builder';

export default async function NewAutomationPage() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  if (!session.activeOrganization || !session.activeTeam) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create Automation</h1>
          <p className="text-muted-foreground">
            Select an organization and team first.
          </p>
        </div>
      </div>
    );
  }

  // Get email templates
  const templates = await db
    .select()
    .from(emailTemplates)
    .where(
      and(
        eq(emailTemplates.organizationId, session.activeOrganization.id),
        eq(emailTemplates.isActive, true)
      )
    );

  // Get pipeline stages
  const [pipeline] = await db
    .select()
    .from(pipelines)
    .where(
      and(
        eq(pipelines.organizationId, session.activeOrganization.id),
        eq(pipelines.teamId, session.activeTeam.id),
        eq(pipelines.isDefault, true)
      )
    )
    .limit(1);

  let stages: typeof pipelineStages.$inferSelect[] = [];
  if (pipeline) {
    stages = await db
      .select()
      .from(pipelineStages)
      .where(eq(pipelineStages.pipelineId, pipeline.id))
      .orderBy(pipelineStages.position);
  }

  // Get team members
  const memberships = await db
    .select({
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(teamMemberships)
    .innerJoin(users, eq(users.id, teamMemberships.userId))
    .where(
      and(
        eq(teamMemberships.teamId, session.activeTeam.id),
        eq(teamMemberships.isActive, true)
      )
    );

  const teamMembers = memberships.map((m) => m.user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Automation</h1>
        <p className="text-muted-foreground">
          Build an automated workflow for {session.activeTeam.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Automation Builder</CardTitle>
          <CardDescription>
            Configure the trigger and actions for your automation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AutomationBuilder
            templates={templates}
            stages={stages}
            teamMembers={teamMembers}
          />
        </CardContent>
      </Card>
    </div>
  );
}
