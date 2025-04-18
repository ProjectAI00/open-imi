"use client";

import { UIMessage } from "ai";
import {
  Check,
  Copy,
  ChevronDown,
  Loader2,
  Pencil,
  ChevronDownIcon,
  RefreshCw,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { Button } from "ui/button";
import { Markdown } from "./markdown";
import { PastesContentCard } from "./pasts-content";
import { cn } from "lib/utils";
import JsonView from "ui/json-view";
import { useState } from "react";
import { MessageEditor } from "./message-editor";
import type { UseChatHelpers } from "@ai-sdk/react";
import { useCopy } from "@/hooks/use-copy";

import { Card, CardContent } from "ui/card";
import { AnimatePresence, motion } from "framer-motion";
import { SelectModel } from "./select-model";
import { customModelProvider } from "lib/ai/models";
import { deleteMessagesByChatIdAfterTimestampAction } from "@/app/api/chat/actions";

import { toast } from "sonner";
import { safe } from "ts-safe";

type MessagePart = UIMessage["parts"][number];

type UserMessagePart = Extract<MessagePart, { type: "text" }>;
type AssistMessagePart = Extract<MessagePart, { type: "text" }>;
type ToolMessagePart = Extract<MessagePart, { type: "tool-invocation" }>;

interface UserMessagePartProps {
  part: UserMessagePart;
  isLast: boolean;
  message: UIMessage;
  setMessages: UseChatHelpers["setMessages"];
  reload: UseChatHelpers["reload"];
}

interface AssistMessagePartProps {
  part: AssistMessagePart;
  message: UIMessage;
  isLast: boolean;
  threadId: string;
  setMessages: UseChatHelpers["setMessages"];
  reload: UseChatHelpers["reload"];
}

interface ToolMessagePartProps {
  part: ToolMessagePart;
}

export const UserMessagePart = ({
  part,
  isLast,
  message,
  setMessages,
  reload,
}: UserMessagePartProps) => {
  const { copied, copy } = useCopy();
  const [mode, setMode] = useState<"view" | "edit">("view");

  if (mode === "edit") {
    return (
      <div className="flex flex-row gap-2 items-start w-full">
        <MessageEditor
          message={message}
          setMode={setMode}
          setMessages={setMessages}
          reload={reload}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 items-end my-2">
      <div
        data-testid="message-content"
        className={cn("flex flex-col gap-4", {
          "bg-muted/50 border border-input px-3 py-2 rounded-xl": isLast,
        })}
      >
        {isLast ? (
          <p className="whitespace-pre-wrap text-sm">{part.text}</p>
        ) : (
          <PastesContentCard initialContent={part.text} readonly />
        )}
      </div>

      <div className="flex w-full justify-end">
        {isLast && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  data-testid="message-edit-button"
                  variant="ghost"
                  size="icon"
                  className="size-3! p-4! opacity-0 group-hover/message:opacity-100"
                  onClick={() => setMode("edit")}
                >
                  <Pencil />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Edit</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  data-testid="message-edit-button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "size-3! p-4! opacity-0 group-hover/message:opacity-100",
                  )}
                  onClick={() => copy(part.text)}
                >
                  {copied ? <Check /> : <Copy />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Copy</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </div>
  );
};

const modelList = customModelProvider.modelsInfo;

export const AssistMessagePart = ({
  part,
  isLast,
  reload,
  message,
  setMessages,
  threadId,
}: AssistMessagePartProps) => {
  const { copied, copy } = useCopy();
  const [isLoading, setIsLoading] = useState(false);

  const handleModelChange = (model: string) => {
    safe(() => setIsLoading(true))
      .ifOk(() => deleteMessagesByChatIdAfterTimestampAction(message.id))
      .ifOk(() =>
        setMessages((messages) => {
          const index = messages.findIndex((m) => m.id === message.id);
          if (index !== -1) {
            return [...messages.slice(0, index)];
          }
          return messages;
        }),
      )
      .ifOk(() =>
        reload({
          body: {
            model,
            mode: "update-assistant",
            id: threadId,
          },
        }),
      )
      .ifFail((error) => toast.error(error.message))
      .watch(() => setIsLoading(false))
      .unwrap();
  };

  return (
    <div
      className={cn(isLoading && "animate-pulse", "flex flex-col gap-2 group")}
    >
      <div data-testid="message-content" className="flex flex-col gap-4">
        <Markdown>{part.text}</Markdown>
      </div>
      {isLast && (
        <div className="flex w-full ">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                data-testid="message-edit-button"
                variant="ghost"
                size="icon"
                className={cn(
                  "size-3! p-4! opacity-0 group-hover/message:opacity-100",
                )}
                onClick={() => copy(part.text)}
              >
                {copied ? <Check /> : <Copy />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <SelectModel
                  model={""}
                  onSelect={handleModelChange}
                  providers={modelList}
                >
                  <Button
                    data-testid="message-edit-button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "size-3! p-4! opacity-0 group-hover/message:opacity-100",
                    )}
                  >
                    {<RefreshCw />}
                  </Button>
                </SelectModel>
              </div>
            </TooltipTrigger>
            <TooltipContent>Change Model</TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
};

export const ToolMessagePart = ({ part }: ToolMessagePartProps) => {
  const { toolInvocation } = part;
  const { toolName, toolCallId, state } = toolInvocation;
  const [isExpanded, setIsExpanded] = useState(false);

  const isLoading = state !== "result";
  return (
    <div key={toolCallId} className="flex flex-col gap-2 group">
      <div
        className="flex flex-row gap-2 items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-row gap-2 justify-between items-center text-muted-foreground min-w-44">
          <p className="text-muted-foreground/80">{toolName}</p>
          {isLoading ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <ChevronDown
              className={cn(
                isExpanded && "rotate-180",
                "transition-transform",
                "size-4",
              )}
            />
          )}
        </div>
      </div>
      {isExpanded && (
        <Card className="relative mt-2 p-4 max-h-[50vh] overflow-y-auto bg-background">
          <CardContent className="flex flex-row gap-4 text-sm ">
            <div className="w-1/2 min-w-0 flex flex-col">
              <div className="flex items-center gap-2 mb-2 pt-2 pb-1 bg-background z-10">
                <h5 className="text-muted-foreground text-sm font-medium">
                  Inputs
                </h5>
              </div>
              <JsonView data={toolInvocation.args} />
            </div>

            <div className="w-1/2 min-w-0 pl-4 flex flex-col">
              <div className="flex items-center gap-2 mb-4 pt-2 pb-1 bg-background z-10">
                <h5 className="text-muted-foreground text-sm font-medium">
                  Outputs
                </h5>
              </div>
              <JsonView
                data={
                  toolInvocation.state === "result"
                    ? toolInvocation.result
                    : null
                }
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export function ReasoningPart({
  reasoning,
}: {
  reasoning: string;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const variants = {
    collapsed: {
      height: 0,
      opacity: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    expanded: {
      height: "auto",
      opacity: 1,
      marginTop: "1rem",
      marginBottom: "0.5rem",
    },
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-row gap-2 items-center">
        <div className="font-medium">Reasoned for a few seconds</div>
        <button
          data-testid="message-reasoning-toggle"
          type="button"
          className="cursor-pointer"
          onClick={() => {
            setIsExpanded(!isExpanded);
          }}
        >
          <ChevronDownIcon />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            data-testid="message-reasoning"
            key="content"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
            className="pl-4 text-muted-foreground border-l flex flex-col gap-4"
          >
            <Markdown>{reasoning}</Markdown>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
