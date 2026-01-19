import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { leads, users, pipelineStages } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LeadsTable } from '@/components/leads/leads-table';

export default async function LeadsPage() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  if (!session.activeOrganization || !session.activeTeam) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground">
            Select an organization and team to view leads.
          </p>
        </div>
      </div>
    );
  }

  const leadsData = await db
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
        eq(leads.organizationId, session.activeOrganization.id),
        eq(leads.teamId, session.activeTeam.id)
      )
    )
    .orderBy(desc(leads.createdAt));

  const leadsWithRelations = leadsData.map((r) => ({
    ...r.lead,
    assignedUser: r.assignedUser?.id ? r.assignedUser : null,
    currentStage: r.stage,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground">
            Manage your leads for {session.activeTeam.name}
          </p>
        </div>
        <Link href="/leads/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        </Link>
      </div>

      {leadsWithRelations.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No leads yet</CardTitle>
            <CardDescription>
              Create your first lead to get started tracking your sales pipeline.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/leads/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create your first lead
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <LeadsTable leads={leadsWithRelations} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
