import type { ChatMessage, ChatService, ChatThread } from "app-types/chat";
import { ChatMessageSchema, ChatThreadSchema } from "./schema.pg";
import { pgDb as db } from "./db.pg";
import { and, desc, eq, gte, sql } from "drizzle-orm";

export const pgChatService: ChatService = {
  insertThread: async (
    thread: PartialBy<ChatThread, "id" | "createdAt">,
  ): Promise<ChatThread> => {
    const result = await db
      .insert(ChatThreadSchema)
      .values({
        ...thread,
        createdAt: thread.createdAt || new Date(),
      })
      .returning();
    return result[0];
  },

  selectThread: async (id: string): Promise<ChatThread | null> => {
    const result = await db
      .select()
      .from(ChatThreadSchema)
      .where(eq(ChatThreadSchema.id, id));
    return result[0] ? result[0] : null;
  },

  selectMessagesByThreadId: async (
    threadId: string,
  ): Promise<ChatMessage[]> => {
    const result = await db
      .select()
      .from(ChatMessageSchema)
      .where(eq(ChatMessageSchema.threadId, threadId))
      .orderBy(ChatMessageSchema.createdAt);
    return result as ChatMessage[];
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
        createdAt: row.createdAt,
      };
    });
  },

  updateThread: async (
    id: string,
    thread: PartialBy<ChatThread, "id" | "createdAt">,
  ): Promise<ChatThread> => {
    const entity = {
      ...thread,
      id,
    } as ChatThread;
    const result = await db
      .update(ChatThreadSchema)
      .set(entity)
      .where(eq(ChatThreadSchema.id, id))
      .returning();
    return result[0];
  },

  deleteThread: async (id: string): Promise<void> => {
    await db.delete(ChatThreadSchema).where(eq(ChatThreadSchema.id, id));
  },

  insertMessage: async (
    message: PartialBy<ChatMessage, "id" | "createdAt">,
  ): Promise<ChatMessage> => {
    const entity = {
      ...message,
      createdAt: message.createdAt || new Date(),
      id: message.id,
    };
    const result = await db
      .insert(ChatMessageSchema)
      .values(entity)
      .returning();
    return result[0] as ChatMessage;
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
