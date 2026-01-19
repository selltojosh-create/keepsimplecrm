import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { leads } from './leads';

export const messageDirectionEnum = pgEnum('message_direction', ['inbound', 'outbound']);
export const messageChannelEnum = pgEnum('message_channel', ['email', 'sms']);
export const messageStatusEnum = pgEnum('message_status', ['queued', 'sent', 'delivered', 'failed', 'received', 'bounced']);

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  direction: messageDirectionEnum('direction').notNull(),
  channel: messageChannelEnum('channel').notNull(),
  fromAddress: text('from_address').notNull(),
  toAddress: text('to_address').notNull(),
  subject: text('subject'),
  bodyHtml: text('body_html'),
  bodyText: text('body_text'),
  status: messageStatusEnum('status').notNull().default('queued'),
  externalId: text('external_id'),
  sentAt: timestamp('sent_at'),
  deliveredAt: timestamp('delivered_at'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
