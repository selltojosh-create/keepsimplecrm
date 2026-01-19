import { pgTable, uuid, text, boolean, timestamp, unique, pgEnum } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

export const dashboardTypeEnum = pgEnum('dashboard_type', ['sales', 'leasing', 'property_management', 'maintenance', 'accounting', 'general']);

export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  dashboardType: dashboardTypeEnum('dashboard_type').notNull().default('general'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  uniqueOrgSlug: unique().on(table.organizationId, table.slug),
}));

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
