import { pgTable, uuid, text, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';
import { organizations } from './organizations';
import { leads } from './leads';

export const timelineEntryTypeEnum = pgEnum('timeline_entry_type', ['note', 'email_sent', 'email_received', 'sms_sent', 'sms_received', 'stage_change', 'status_change', 'assignment', 'automation', 'system']);

export const timelineEntries = pgTable('timeline_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  entryType: timelineEntryTypeEnum('entry_type').notNull(),
  content: text('content'),
  metadata: jsonb('metadata').$type<{
    fromStage?: string;
    toStage?: string;
    fromUser?: string;
    toUser?: string;
    emailSubject?: string;
    automationName?: string;
  }>(),
  createdByUserId: uuid('created_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type TimelineEntry = typeof timelineEntries.$inferSelect;
export type NewTimelineEntry = typeof timelineEntries.$inferInsert;
