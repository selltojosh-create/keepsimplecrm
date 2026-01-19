import { pgTable, uuid, text, boolean, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { teams } from './teams';

export const triggerTypeEnum = pgEnum('trigger_type', ['lead_created', 'stage_changed', 'status_changed', 'time_delay', 'manual']);

export const automations = pgTable('automations', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(false),
  triggerType: triggerTypeEnum('trigger_type').notNull(),
  triggerConfig: jsonb('trigger_config').$type<{
    stageId?: string;
    statusValue?: string;
    channel?: string;
    delayMinutes?: number;
  }>(),
  appliesToChannel: text('applies_to_channel'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Automation = typeof automations.$inferSelect;
export type NewAutomation = typeof automations.$inferInsert;
