import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { leads, users, pipelineStages, timelineEntries } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LeadHeader } from '@/components/leads/lead-header';
import { LeadTimeline } from '@/components/leads/lead-timeline';
import { LeadDetails } from '@/components/leads/lead-details';

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  const { id } = await params;

  if (!session || !session.activeOrganization) {
    return null;
  }

  const [result] = await db
    .select({
      lead: leads,
      assignedUser: {
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
      },
      stage: pipelineStages,
    })
    .from(leads)
    .leftJoin(users, eq(leads.assignedUserId, users.id))
    .leftJoin(pipelineStages, eq(leads.currentStageId, pipelineStages.id))
    .where(
      and(
        eq(leads.id, id),
        eq(leads.organizationId, session.activeOrganization.id)
      )
    )
    .limit(1);

  if (!result) {
    notFound();
  }

  const timeline = await db
    .select({
      entry: timelineEntries,
      createdBy: {
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(timelineEntries)
    .leftJoin(users, eq(timelineEntries.createdByUserId, users.id))
    .where(eq(timelineEntries.leadId, id))
    .orderBy(desc(timelineEntries.createdAt));

  const lead = {
    ...result.lead,
    assignedUser: result.assignedUser?.id ? result.assignedUser : null,
    currentStage: result.stage,
  };

  const timelineWithUsers = timeline.map((t) => ({
    ...t.entry,
    createdBy: t.createdBy?.id ? t.createdBy : null,
  }));

  return (
    <div className="space-y-6">
      <LeadHeader lead={lead} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadTimeline leadId={lead.id} entries={timelineWithUsers} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <LeadDetails lead={lead} />
        </div>
      </div>
    </div>
  );
}
