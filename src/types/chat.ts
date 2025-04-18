import type { UIMessage } from "ai";

export type ChatThread = {
  id: string;
  title: string;
  userId: string;
  createdAt: Date;
};

export type ChatMessage = {
  id: string;
  threadId: string;
  role: UIMessage["role"];
  parts: UIMessage["parts"];
  attachments: unknown[];
  model: string | null;
  createdAt: Date;
};

export type ChatService = {
  insertThread(
    thread: PartialBy<ChatThread, "id" | "createdAt">,
  ): Promise<ChatThread>;

  selectThread(id: string): Promise<ChatThread | null>;

  selectMessagesByThreadId(threadId: string): Promise<ChatMessage[]>;

  selectThreadsByUserId(userId: string): Promise<ChatThread[]>;

  updateThread(
    id: string,
    thread: PartialBy<ChatThread, "id" | "createdAt">,
  ): Promise<ChatThread>;

  deleteThread(id: string): Promise<void>;

  insertMessage(
    message: PartialBy<ChatMessage, "id" | "createdAt">,
  ): Promise<ChatMessage>;

  deleteMessagesByChatIdAfterTimestamp(messageId: string): Promise<void>;
};
