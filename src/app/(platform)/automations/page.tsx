import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { automations, automationSteps } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AutomationsList } from '@/components/automations/automations-list';

export default async function AutomationsPage() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  if (!session.activeOrganization || !session.activeTeam) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Automations</h1>
          <p className="text-muted-foreground">
            Select an organization and team to view automations.
          </p>
        </div>
      </div>
    );
  }

  const automationsList = await db
    .select()
    .from(automations)
    .where(
      and(
        eq(automations.organizationId, session.activeOrganization.id),
        eq(automations.teamId, session.activeTeam.id)
      )
    )
    .orderBy(desc(automations.createdAt));

  const automationsWithSteps = await Promise.all(
    automationsList.map(async (automation) => {
      const steps = await db
        .select()
        .from(automationSteps)
        .where(eq(automationSteps.automationId, automation.id))
        .orderBy(automationSteps.position);

      return {
        ...automation,
        steps,
        stepCount: steps.length,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automations</h1>
          <p className="text-muted-foreground">
            Create automated workflows for {session.activeTeam.name}
          </p>
        </div>
        <Link href="/automations/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Automation
          </Button>
        </Link>
      </div>

      {automationsWithSteps.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No automations yet</CardTitle>
            <CardDescription>
              Create your first automation to streamline your workflow.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/automations/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create your first automation
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <AutomationsList automations={automationsWithSteps} />
      )}
    </div>
  );
}
