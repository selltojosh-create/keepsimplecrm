import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { emailTemplates } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { createTemplateSchema } from '@/lib/validations/templates';

// GET /api/templates - List all templates
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.activeOrganization) {
      return NextResponse.json({ error: 'No active organization' }, { status: 400 });
    }

    const templates = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.organizationId, session.activeOrganization.id))
      .orderBy(desc(emailTemplates.createdAt));

    return NextResponse.json({ data: templates });
  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// POST /api/templates - Create a new template
export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.activeOrganization) {
      return NextResponse.json({ error: 'No active organization' }, { status: 400 });
    }

    const body = await request.json();
    const result = createTemplateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    const [template] = await db
      .insert(emailTemplates)
      .values({
        organizationId: session.activeOrganization.id,
        teamId: session.activeTeam?.id || null,
        name: data.name,
        subject: data.subject,
        bodyHtml: data.bodyHtml,
        bodyText: data.bodyText || null,
      })
      .returning();

    return NextResponse.json({ data: template }, { status: 201 });
  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
