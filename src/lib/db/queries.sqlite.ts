import type { ChatMessage, ChatService, ChatThread } from "app-types/chat";
import { ChatMessageSchema, ChatThreadSchema } from "./schema.sqlite";
import { sqliteDb as db } from "./db.sqlite";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { generateUUID } from "lib/utils";
import { UIMessage } from "ai";

const convertToDate = (timestamp: number): Date => {
  return new Date(timestamp);
};

const convertToTimestamp = (date: Date): number => {
  return date.getTime();
};

const convertToChatThread = (row: {
  id: string;
  createdAt: number;
  title: string;
  userId: string;
}): ChatThread => {
  return {
    id: row.id,
    createdAt: convertToDate(row.createdAt),
    title: row.title,
    userId: row.userId,
  };
};

const convertToChatMessage = (row: {
  id: string;
  createdAt: number;
  threadId: string;
  role: string;
  parts: string;
  attachments: string | null;
  model: string | null;
}): ChatMessage => {
  return {
    id: row.id,
    createdAt: convertToDate(row.createdAt),
    threadId: row.threadId,
    role: row.role as UIMessage["role"],
    parts: JSON.parse(row.parts) as UIMessage["parts"],
    attachments: row.attachments ? JSON.parse(row.attachments) : [],
    model: row.model,
  };
};

export const sqliteChatService: ChatService = {
  insertThread: async (
    thread: PartialBy<ChatThread, "id" | "createdAt">,
  ): Promise<ChatThread> => {
    const result = await db
      .insert(ChatThreadSchema)
      .values({
        ...thread,
        id: thread.id || generateUUID(),
        createdAt: (thread.createdAt || new Date()).getTime(),
      })
      .returning();
    return convertToChatThread(result[0]);
  },

  selectThread: async (id: string): Promise<ChatThread | null> => {
    const result = await db
      .select()
      .from(ChatThreadSchema)
      .where(eq(ChatThreadSchema.id, id));
    return result[0] ? convertToChatThread(result[0]) : null;
  },

  selectMessagesByThreadId: async (
    threadId: string,
  ): Promise<ChatMessage[]> => {
    const result = await db
      .select()
      .from(ChatMessageSchema)
      .where(eq(ChatMessageSchema.threadId, threadId))
      .orderBy(ChatMessageSchema.createdAt);
    return result.map(convertToChatMessage);
  },

  selectThreadsByUserId: async (userId: string): Promise<ChatThread[]> => {
    const threadWithLatestMessage = await db
      .select({
        threadId: ChatThreadSchema.id,
        title: ChatThreadSchema.title,
        createdAt: ChatThreadSchema.createdAt,
        userId: ChatThreadSchema.userId,

        lastMessageAt: sql<string>`MAX(${ChatMessageSchema.createdAt})`.as(
          "last_message_at",
        ),
      })
      .from(ChatThreadSchema)
      .leftJoin(
        ChatMessageSchema,
        eq(ChatThreadSchema.id, ChatMessageSchema.threadId),
      )
      .where(eq(ChatThreadSchema.userId, userId))
      .groupBy(
        ChatThreadSchema.id,
        ChatThreadSchema.title,
        ChatThreadSchema.createdAt,
      )
      .orderBy(desc(sql`last_message_at`));

    return threadWithLatestMessage.map((row) => {
      return {
        id: row.threadId,
        title: row.title,
        userId: row.userId,
        createdAt: convertToDate(row.createdAt),
      };
    });
  },

  updateThread: async (
    id: string,
    thread: PartialBy<ChatThread, "id" | "createdAt">,
  ): Promise<ChatThread> => {
    const result = await db
      .update(ChatThreadSchema)
      .set({
        ...thread,
        createdAt: convertToTimestamp(thread.createdAt || new Date()),
      })
      .where(eq(ChatThreadSchema.id, id))
      .returning();
    return convertToChatThread(result[0]);
  },

  deleteThread: async (id: string): Promise<void> => {
    await db.delete(ChatThreadSchema).where(eq(ChatThreadSchema.id, id));
  },

  insertMessage: async (
    message: PartialBy<ChatMessage, "id" | "createdAt">,
  ): Promise<ChatMessage> => {
    const result = await db
      .insert(ChatMessageSchema)
      .values({
        ...message,
        createdAt: convertToTimestamp(message.createdAt || new Date()),
        id: message.id || generateUUID(),
        parts: JSON.stringify(message.parts),
        attachments: message.attachments
          ? JSON.stringify(message.attachments)
          : null,
      })
      .returning();
    return convertToChatMessage(result[0]);
  },

  deleteMessagesByChatIdAfterTimestamp: async (
    messageId: string,
  ): Promise<void> => {
    const [message] = await db
      .select()
      .from(ChatMessageSchema)
      .where(eq(ChatMessageSchema.id, messageId));
    if (!message) {
      return;
    }
    // Delete messages that are in the same thread AND created before or at the same time as the target message
    await db
      .delete(ChatMessageSchema)
      .where(
        and(
          eq(ChatMessageSchema.threadId, message.threadId),
          gte(ChatMessageSchema.createdAt, message.createdAt),
        ),
      );
  },
};
