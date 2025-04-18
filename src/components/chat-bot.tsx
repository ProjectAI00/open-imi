"use client";

import type { UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { toast } from "sonner";
import { mutate } from "swr";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import PromptInput from "./prompt-input";
import clsx from "clsx";
import { appStore } from "@/app/store";
import { generateUUID } from "lib/utils";
import { PreviewMessage, ThinkingMessage } from "./message";
import { Greeting } from "./greeting";
import logger from "logger";
import { useShallow } from "zustand/shallow";

type Props = {
  threadId: string;
  initialMessages: Array<UIMessage>;
  selectedChatModel?: string;
};

export default function ChatBot({ threadId, initialMessages }: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [appStoreMutate, model] = appStore(
    useShallow((state) => [state.mutate, state.model]),
  );

  const {
    messages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    reload,
    setMessages,
    stop,
  } = useChat({
    id: threadId,
    api: "/api/chat",
    body: { id: threadId, model },
    initialMessages: initialMessages,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    experimental_throttle: 100,
    onFinish: () => {
      mutate("threads");
      if (!threadId) {
        router.push(`/chat/${threadId}`);
      }
    },
    onError: (error) => {
      logger.error(error);
      toast.error(error.message || "An error occured, please try again!");
    },
  });

  const isLoading = useMemo(
    () => status === "streaming" || status === "submitted",
    [status],
  );

  const isInitialThreadEntry = useMemo(
    () =>
      initialMessages.length > 0 &&
      initialMessages.at(-1)?.id === messages.at(-1)?.id,
    [initialMessages, messages],
  );

  const spaceClass = "min-h-[55dvh]";

  const needSpaceClass = useCallback(
    (index: number) => {
      if (isInitialThreadEntry || index != messages.length - 1) return false;
      const message = messages[index];
      if (message.role === "user") return false;
      return true;
    },
    [messages],
  );

  useEffect(() => {
    appStoreMutate({ currentThreadId: threadId });
    return () => {
      appStoreMutate({ currentThreadId: null });
    };
  }, [threadId]);

  useEffect(() => {
    if (isInitialThreadEntry)
      containerRef.current?.scrollTo({
        top: containerRef.current?.scrollHeight,
        behavior: "instant",
      });
  }, [isInitialThreadEntry]);

  useEffect(() => {
    if (status === "submitted") {
      containerRef.current?.scrollTo({
        top: containerRef.current?.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [status]);

  // Highlight messages based on hash fragment
  useEffect(() => {
    const handleHashChange = () => {
      const messageId = window.location.hash.replace('#message-', '');
      if (messageId) {
        const messageElement = document.getElementById(`message-${messageId}`);
        if (messageElement) {
          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          messageElement.classList.add('highlight-message');
          
          // Remove highlight after animation completes
          setTimeout(() => {
            messageElement.classList.remove('highlight-message');
          }, 2000);
        }
      }
    };
    
    // Check on initial load
    handleHashChange();
    
    // Add event listener for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [messages]);

  return (
    <div className="flex flex-col min-w-0 relative h-full">
      {messages.length > 0 ? (
        <>
          <div
            className={"flex flex-col gap-2 overflow-y-auto py-6"}
            ref={containerRef}
          >
            {messages.map((message, index) => (
              <PreviewMessage
                threadId={threadId}
                key={message.id}
                message={message}
                isLoading={isLoading && messages.length - 1 === index}
                setMessages={setMessages}
                reload={reload}
                className={needSpaceClass(index) ? spaceClass : ""}
              />
            ))}
            {status === "submitted" && messages.at(-1)?.role === "user" && (
              <ThinkingMessage className={spaceClass} />
            )}
            <div className="min-w-0 min-h-52" />
          </div>
        </>
      ) : (
        <div className="mt-36">
          <Greeting />
        </div>
      )}
      <div className={clsx(messages.length && "absolute bottom-14", "w-full")}>
        <PromptInput
          threadId={threadId}
          input={input}
          append={append}
          setInput={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onStop={stop}
        />
      </div>
    </div>
  );
}
