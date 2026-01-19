import { Lucia } from 'lucia';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from '@/lib/db';
import { sessions, users } from '@/lib/db/schema';

const adapter = new DrizzlePostgreSQLAdapter(db, sessions, users);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    name: 'session',
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  },
  getUserAttributes: (attributes) => {
    return {
      id: attributes.id,
      email: attributes.email,
      name: attributes.name,
      avatarUrl: attributes.avatarUrl,
      isPlatformOwner: attributes.isPlatformOwner,
      isActive: attributes.isActive,
    };
  },
  getSessionAttributes: (attributes) => {
    return {
      activeOrganizationId: attributes.activeOrganizationId,
      activeTeamId: attributes.activeTeamId,
    };
  },
});

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
    DatabaseSessionAttributes: DatabaseSessionAttributes;
  }
}

interface DatabaseUserAttributes {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  isPlatformOwner: boolean;
  isActive: boolean;
}

interface DatabaseSessionAttributes {
  activeOrganizationId: string | null;
  activeTeamId: string | null;
}
