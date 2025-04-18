import { selectThreadWithMessagesAction } from "@/app/api/chat/actions";
import ChatBot from "@/components/chat-bot";
import { UIMessage } from "ai";
import { ChatMessage } from "app-types/chat";
import { redirect } from "next/navigation";

function convertToUIMessage(message: ChatMessage): UIMessage {
  const um: UIMessage = {
    id: message.id,
    parts: message.parts as UIMessage["parts"],
    role: message.role as UIMessage["role"],
    content: "",
    createdAt: new Date(message.createdAt),
  };
  return um;
}

const fetchMessages = async (threadId: string): Promise<UIMessage[]> => {
  const response = await selectThreadWithMessagesAction(threadId);
  if (!response) return [];
  return response.messages.map(convertToUIMessage);
};

export default async function Page({
  params,
}: { params: Promise<{ thread: string }> }) {
  const { thread } = await params;

  const initialMessages = await fetchMessages(thread);

  if (initialMessages.length === 0) redirect("/");

  return (
    <ChatBot threadId={thread} key={thread} initialMessages={initialMessages} />
  );
}
