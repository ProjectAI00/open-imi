"use client";

import ChatBot from "@/components/chat-bot";
import { generateUUID } from "lib/utils";
import { useSearchParams } from "next/navigation";

export default function HomePage() {
  const searchParams = useSearchParams();
  // Gebruik de 'new' parameter als die er is, anders genereer een nieuwe UUID
  // Dit zorgt ervoor dat de New Chat knop werkt
  const id = searchParams.get('new') || generateUUID();
  return <ChatBot initialMessages={[]} threadId={id} key={id} />;
}
