import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { automations, automationSteps } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { createAutomationSchema } from '@/lib/validations/automations';

// GET /api/automations - List all automations
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.activeOrganization || !session.activeTeam) {
      return NextResponse.json({ error: 'No active organization or team' }, { status: 400 });
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

    // Get steps for each automation
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

    return NextResponse.json({ data: automationsWithSteps });
  } catch (error) {
    console.error('Get automations error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// POST /api/automations - Create a new automation
export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.activeOrganization || !session.activeTeam) {
      return NextResponse.json({ error: 'No active organization or team' }, { status: 400 });
    }

    const body = await request.json();
    const result = createAutomationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    // Create automation
    const [automation] = await db
      .insert(automations)
      .values({
        organizationId: session.activeOrganization.id,
        teamId: session.activeTeam.id,
        name: data.name,
        description: data.description || null,
        triggerType: data.triggerType,
        triggerConfig: data.triggerConfig || null,
        appliesToChannel: data.appliesToChannel || null,
        isActive: false,
      })
      .returning();

    // Create steps if provided
    if (data.steps && data.steps.length > 0) {
      await db.insert(automationSteps).values(
        data.steps.map((step) => ({
          organizationId: session.activeOrganization!.id,
          automationId: automation.id,
          position: step.position,
          actionType: step.actionType,
          actionConfig: step.actionConfig || null,
        }))
      );
    }

    return NextResponse.json({ data: automation }, { status: 201 });
  } catch (error) {
    console.error('Create automation error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
