import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { leads, timelineEntries } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const noteSchema = z.object({
  content: z.string().min(1, 'Note content is required'),
});

export async function POST(
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
    const [lead] = await db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.id, id),
          eq(leads.organizationId, session.activeOrganization.id)
        )
      )
      .limit(1);

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const body = await request.json();
    const result = noteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const [entry] = await db
      .insert(timelineEntries)
      .values({
        organizationId: session.activeOrganization.id,
        leadId: id,
        entryType: 'note',
        content: result.data.content,
        createdByUserId: session.user.id,
      })
      .returning();

    return NextResponse.json({ data: entry }, { status: 201 });
  } catch (error) {
    console.error('Add note error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
