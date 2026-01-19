import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { leads, users, pipelineStages } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';

// GET /api/pipelines/[id]/leads - Get all leads for a pipeline organized by stage
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id: pipelineId } = await params;

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.activeOrganization || !session.activeTeam) {
      return NextResponse.json({ error: 'No active organization or team' }, { status: 400 });
    }

    // Get all stages for the pipeline
    const stages = await db
      .select()
      .from(pipelineStages)
      .where(eq(pipelineStages.pipelineId, pipelineId))
      .orderBy(asc(pipelineStages.position));

    // Get all leads for this pipeline
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
          eq(leads.currentPipelineId, pipelineId),
          eq(leads.organizationId, session.activeOrganization.id),
          eq(leads.teamId, session.activeTeam.id)
        )
      );

    // Organize leads by stage
    const stagesWithLeads = stages.map((stage) => ({
      ...stage,
      leads: pipelineLeads
        .filter((l) => l.lead.currentStageId === stage.id)
        .map((l) => ({
          ...l.lead,
          assignedUser: l.assignedUser?.id ? l.assignedUser : null,
        })),
    }));

    return NextResponse.json({ data: stagesWithLeads });
  } catch (error) {
    console.error('Get pipeline leads error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
