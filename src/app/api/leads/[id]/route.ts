import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { leads, users, pipelineStages, timelineEntries } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { updateLeadSchema } from '@/lib/validations/leads';

// GET /api/leads/[id] - Get a single lead with timeline
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
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Get timeline entries
    const timeline = await db
      .select()
      .from(timelineEntries)
      .where(eq(timelineEntries.leadId, id))
      .orderBy(desc(timelineEntries.createdAt));

    const leadWithRelations = {
      ...result.lead,
      assignedUser: result.assignedUser?.id ? result.assignedUser : null,
      currentStage: result.stage,
      timeline,
    };

    return NextResponse.json({ data: leadWithRelations });
  } catch (error) {
    console.error('Get lead error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// PATCH /api/leads/[id] - Update a lead
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
    const result = updateLeadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Verify lead exists and belongs to org
    const [existingLead] = await db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.id, id),
          eq(leads.organizationId, session.activeOrganization.id)
        )
      )
      .limit(1);

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const data = result.data;
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Only include fields that are provided
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName || null;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.addressLine1 !== undefined) updateData.addressLine1 = data.addressLine1 || null;
    if (data.addressLine2 !== undefined) updateData.addressLine2 = data.addressLine2 || null;
    if (data.addressCity !== undefined) updateData.addressCity = data.addressCity || null;
    if (data.addressState !== undefined) updateData.addressState = data.addressState || null;
    if (data.addressZip !== undefined) updateData.addressZip = data.addressZip || null;
    if (data.source !== undefined) updateData.source = data.source;
    if (data.channel !== undefined) updateData.channel = data.channel || null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.tags !== undefined) updateData.tags = data.tags || null;
    if (data.assignedUserId !== undefined) updateData.assignedUserId = data.assignedUserId;
    if (data.currentStageId !== undefined) updateData.currentStageId = data.currentStageId;

    const [updatedLead] = await db
      .update(leads)
      .set(updateData)
      .where(eq(leads.id, id))
      .returning();

    // Add timeline entry for stage change
    if (data.currentStageId && data.currentStageId !== existingLead.currentStageId) {
      await db.insert(timelineEntries).values({
        organizationId: session.activeOrganization.id,
        leadId: id,
        entryType: 'stage_change',
        content: 'Lead moved to new stage',
        metadata: {
          fromStage: existingLead.currentStageId || undefined,
          toStage: data.currentStageId,
        },
        createdByUserId: session.user.id,
      });
    }

    // Add timeline entry for status change
    if (data.status && data.status !== existingLead.status) {
      await db.insert(timelineEntries).values({
        organizationId: session.activeOrganization.id,
        leadId: id,
        entryType: 'status_change',
        content: `Status changed to ${data.status}`,
        createdByUserId: session.user.id,
      });
    }

    return NextResponse.json({ data: updatedLead });
  } catch (error) {
    console.error('Update lead error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// DELETE /api/leads/[id] - Delete a lead
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

    // Verify lead exists and belongs to org
    const [existingLead] = await db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.id, id),
          eq(leads.organizationId, session.activeOrganization.id)
        )
      )
      .limit(1);

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    await db.delete(leads).where(eq(leads.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete lead error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
