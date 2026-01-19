import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { pipelines, pipelineStages, leads, users } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PipelineBoard } from '@/components/pipeline/pipeline-board';

export default async function PipelinePage() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  if (!session.activeOrganization || !session.activeTeam) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Pipeline</h1>
          <p className="text-muted-foreground">
            Select an organization and team to view your pipeline.
          </p>
        </div>
      </div>
    );
  }

  // Get default pipeline
  const [pipeline] = await db
    .select()
    .from(pipelines)
    .where(
      and(
        eq(pipelines.organizationId, session.activeOrganization.id),
        eq(pipelines.teamId, session.activeTeam.id),
        eq(pipelines.isDefault, true),
        eq(pipelines.isActive, true)
      )
    )
    .limit(1);

  if (!pipeline) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Pipeline</h1>
          <p className="text-muted-foreground">
            No pipeline configured for {session.activeTeam.name}.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>No Pipeline Found</CardTitle>
            <CardDescription>
              Create a pipeline in settings to get started.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Get stages with leads
  const stages = await db
    .select()
    .from(pipelineStages)
    .where(eq(pipelineStages.pipelineId, pipeline.id))
    .orderBy(asc(pipelineStages.position));

  const pipelineLeads = await db
    .select({
      lead: leads,
      assignedUser: {
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(leads)
    .leftJoin(users, eq(leads.assignedUserId, users.id))
    .where(
      and(
        eq(leads.currentPipelineId, pipeline.id),
        eq(leads.organizationId, session.activeOrganization.id),
        eq(leads.teamId, session.activeTeam.id)
      )
    );

  const stagesWithLeads = stages.map((stage) => ({
    ...stage,
    leads: pipelineLeads
      .filter((l) => l.lead.currentStageId === stage.id)
      .map((l) => ({
        ...l.lead,
        assignedUser: l.assignedUser?.id ? l.assignedUser : null,
      })),
  }));

  return (
    <div className="space-y-6 h-full">
      <div>
        <h1 className="text-3xl font-bold">{pipeline.name}</h1>
        <p className="text-muted-foreground">
          Drag and drop leads to move them through stages
        </p>
      </div>

      <PipelineBoard stages={stagesWithLeads} pipelineId={pipeline.id} />
    </div>
  );
}
