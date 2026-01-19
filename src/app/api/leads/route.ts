import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { leads, users, pipelines, pipelineStages } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { createLeadSchema } from '@/lib/validations/leads';

// GET /api/leads - List all leads for current org/team
export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.activeOrganization || !session.activeTeam) {
      return NextResponse.json({ error: 'No active organization or team' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const stageId = searchParams.get('stageId');

    let query = db
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

    const results = await query;

    // Filter by status/stageId if provided
    let filteredResults = results;
    if (status) {
      filteredResults = filteredResults.filter((r) => r.lead.status === status);
    }
    if (stageId) {
      filteredResults = filteredResults.filter((r) => r.lead.currentStageId === stageId);
    }

    const leadsWithRelations = filteredResults.map((r) => ({
      ...r.lead,
      assignedUser: r.assignedUser?.id ? r.assignedUser : null,
      currentStage: r.stage,
    }));

    return NextResponse.json({ data: leadsWithRelations });
  } catch (error) {
    console.error('Get leads error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// POST /api/leads - Create a new lead
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
    const result = createLeadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    // Get default pipeline and first stage if not provided
    let pipelineId = data.pipelineId;
    let stageId = data.stageId;

    if (!pipelineId) {
      const [defaultPipeline] = await db
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

      if (defaultPipeline) {
        pipelineId = defaultPipeline.id;
      }
    }

    if (pipelineId && !stageId) {
      const [firstStage] = await db
        .select()
        .from(pipelineStages)
        .where(eq(pipelineStages.pipelineId, pipelineId))
        .orderBy(pipelineStages.position)
        .limit(1);

      if (firstStage) {
        stageId = firstStage.id;
      }
    }

    const [lead] = await db
      .insert(leads)
      .values({
        organizationId: session.activeOrganization.id,
        teamId: session.activeTeam.id,
        firstName: data.firstName,
        lastName: data.lastName || null,
        email: data.email || null,
        phone: data.phone || null,
        addressLine1: data.addressLine1 || null,
        addressLine2: data.addressLine2 || null,
        addressCity: data.addressCity || null,
        addressState: data.addressState || null,
        addressZip: data.addressZip || null,
        source: data.source,
        channel: data.channel || null,
        tags: data.tags || null,
        assignedUserId: data.assignedUserId || null,
        currentPipelineId: pipelineId || null,
        currentStageId: stageId || null,
      })
      .returning();

    return NextResponse.json({ data: lead }, { status: 201 });
  } catch (error) {
    console.error('Create lead error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
