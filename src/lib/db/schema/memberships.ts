import { pgTable, uuid, boolean, timestamp, unique, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';
import { organizations } from './organizations';

export const orgRoleEnum = pgEnum('org_role', ['admin', 'employee']);

export const memberships = pgTable('memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  orgRole: orgRoleEnum('org_role').notNull().default('employee'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  uniqueUserOrg: unique().on(table.userId, table.organizationId),
}));

export type Membership = typeof memberships.$inferSelect;
export type NewMembership = typeof memberships.$inferInsert;
