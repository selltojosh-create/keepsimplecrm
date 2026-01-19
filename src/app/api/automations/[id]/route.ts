import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { automations, automationSteps } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { updateAutomationSchema } from '@/lib/validations/automations';

// GET /api/automations/[id] - Get a single automation with steps
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id } = await params;

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.activeOrganization) {
      return NextResponse.json({ error: 'No active organization' }, { status: 400 });
    }

    const [automation] = await db
      .select()
      .from(automations)
      .where(
        and(
          eq(automations.id, id),
          eq(automations.organizationId, session.activeOrganization.id)
        )
      )
      .limit(1);

    if (!automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    const steps = await db
      .select()
      .from(automationSteps)
      .where(eq(automationSteps.automationId, id))
      .orderBy(automationSteps.position);

    return NextResponse.json({
      data: {
        ...automation,
        steps,
      },
    });
  } catch (error) {
    console.error('Get automation error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// PATCH /api/automations/[id] - Update an automation
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id } = await params;

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.activeOrganization) {
      return NextResponse.json({ error: 'No active organization' }, { status: 400 });
    }

    const body = await request.json();
    const result = updateAutomationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Verify automation exists
    const [existing] = await db
      .select()
      .from(automations)
      .where(
        and(
          eq(automations.id, id),
          eq(automations.organizationId, session.activeOrganization.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    const data = result.data;
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.triggerType !== undefined) updateData.triggerType = data.triggerType;
    if (data.triggerConfig !== undefined) updateData.triggerConfig = data.triggerConfig || null;
    if (data.appliesToChannel !== undefined) updateData.appliesToChannel = data.appliesToChannel || null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const [updated] = await db
      .update(automations)
      .set(updateData)
      .where(eq(automations.id, id))
      .returning();

    // Update steps if provided
    if (data.steps !== undefined) {
      // Delete existing steps
      await db.delete(automationSteps).where(eq(automationSteps.automationId, id));

      // Insert new steps
      if (data.steps.length > 0) {
        await db.insert(automationSteps).values(
          data.steps.map((step) => ({
            organizationId: session.activeOrganization!.id,
            automationId: id,
            position: step.position,
            actionType: step.actionType,
            actionConfig: step.actionConfig || null,
          }))
        );
      }
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Update automation error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// DELETE /api/automations/[id] - Delete an automation
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id } = await params;

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.activeOrganization) {
      return NextResponse.json({ error: 'No active organization' }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(automations)
      .where(
        and(
          eq(automations.id, id),
          eq(automations.organizationId, session.activeOrganization.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    await db.delete(automations).where(eq(automations.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete automation error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
