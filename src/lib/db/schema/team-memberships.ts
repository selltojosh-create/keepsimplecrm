import { pgTable, uuid, boolean, timestamp, unique, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';
import { organizations } from './organizations';
import { teams } from './teams';

export const teamRoleEnum = pgEnum('team_role', ['auditor', 'manager', 'member']);

export const teamMemberships = pgTable('team_memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  teamRole: teamRoleEnum('team_role').notNull().default('member'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  uniqueTeamUser: unique().on(table.teamId, table.userId),
}));

export type TeamMembership = typeof teamMemberships.$inferSelect;
export type NewTeamMembership = typeof teamMemberships.$inferInsert;
