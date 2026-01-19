import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { memberships, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'employee']),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.activeOrganization) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if current user is admin
  const [currentUserMembership] = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.organizationId, session.activeOrganization.id),
        eq(memberships.userId, session.user.id)
      )
    )
    .limit(1);

  if (!currentUserMembership || currentUserMembership.orgRole !== 'admin') {
    return NextResponse.json(
      { error: 'Only admins can invite members' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const result = inviteSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { email, role } = result.data;

  // Find user by email
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (!existingUser) {
    return NextResponse.json(
      { error: 'No user found with this email. They must register first.' },
      { status: 404 }
    );
  }

  // Check if already a member
  const [existingMembership] = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.organizationId, session.activeOrganization.id),
        eq(memberships.userId, existingUser.id)
      )
    )
    .limit(1);

  if (existingMembership) {
    return NextResponse.json(
      { error: 'This user is already a member of this organization' },
      { status: 400 }
    );
  }

  // Create membership
  const [newMembership] = await db
    .insert(memberships)
    .values({
      organizationId: session.activeOrganization.id,
      userId: existingUser.id,
      orgRole: role,
    })
    .returning();

  return NextResponse.json(newMembership, { status: 201 });
}
