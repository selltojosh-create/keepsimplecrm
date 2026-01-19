import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { pipelines, pipelineStages, leads } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';

// GET /api/pipelines - Get pipelines with stages and lead counts
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.activeOrganization || !session.activeTeam) {
      return NextResponse.json({ error: 'No active organization or team' }, { status: 400 });
    }

    // Get pipelines for current team
    const pipelineList = await db
      .select()
      .from(pipelines)
      .where(
        and(
          eq(pipelines.organizationId, session.activeOrganization.id),
          eq(pipelines.teamId, session.activeTeam.id),
          eq(pipelines.isActive, true)
        )
      );

    // Get stages for each pipeline with lead counts
    const pipelinesWithStages = await Promise.all(
      pipelineList.map(async (pipeline) => {
        const stages = await db
          .select()
          .from(pipelineStages)
          .where(eq(pipelineStages.pipelineId, pipeline.id))
          .orderBy(asc(pipelineStages.position));

        // Get lead counts per stage
        const stagesWithCounts = await Promise.all(
          stages.map(async (stage) => {
            const leadsInStage = await db
              .select()
              .from(leads)
              .where(
                and(
                  eq(leads.currentStageId, stage.id),
                  eq(leads.organizationId, session.activeOrganization!.id),
                  eq(leads.teamId, session.activeTeam!.id)
                )
              );

            return {
              ...stage,
              leadCount: leadsInStage.length,
            };
          })
        );

        return {
          ...pipeline,
          stages: stagesWithCounts,
        };
      })
    );

    return NextResponse.json({ data: pipelinesWithStages });
  } catch (error) {
    console.error('Get pipelines error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
