import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const ChatThreadSchema = sqliteTable("chat_thread", {
  id: text("id").primaryKey().notNull(),
  title: text("title").notNull(),
  userId: text("user_id").notNull(),
  createdAt: integer("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const ChatMessageSchema = sqliteTable("chat_message", {
  id: text("id").primaryKey().notNull(),
  threadId: text("thread_id").notNull(),
  role: text("role").notNull(),
  parts: text("parts").notNull(),
  attachments: text("attachments"),
  model: text("model"),
  createdAt: integer("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
