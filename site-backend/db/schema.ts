import { integer, sqliteTable, text, index } from 'drizzle-orm/sqlite-core';

export const rehearsals = sqliteTable('rehearsals', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  title: text('title').notNull(),
  scenario: text('scenario').notNull(),
  fear: text('fear').notNull(),
  action: text('action').notNull(),
  tensionBefore: integer('tension_before').notNull(),
  predictedImpact: integer('predicted_impact').notNull(),
  readinessBefore: integer('readiness_before').notNull(),
  readinessAfter: integer('readiness_after').notNull(),
  outcome: text('outcome'),
  impact: integer('impact'),
}, (table) => [index('rehearsals_user_created_idx').on(table.userId, table.createdAt)]);

export const prismaUsers = sqliteTable('prisma_users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordSalt: text('password_salt').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull(),
});

export const prismaSessions = sqliteTable('prisma_sessions', {
  tokenHash: text('token_hash').primaryKey(),
  userId: text('user_id').notNull().references(() => prismaUsers.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').notNull(),
  expiresAt: text('expires_at').notNull(),
}, (table) => [index('prisma_sessions_user_idx').on(table.userId)]);

export const authAttempts = sqliteTable('auth_attempts', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  windowStart: integer('window_start').notNull(),
});
