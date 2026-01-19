import { pgTable, text, uuid, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { organizations } from './organizations';
import { teams } from './teams';

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  activeOrganizationId: uuid('active_organization_id').references(() => organizations.id),
  activeTeamId: uuid('active_team_id').references(() => teams.id),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
});

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
