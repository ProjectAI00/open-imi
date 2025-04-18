"use client";

import { motion } from "framer-motion";

import { cn } from "lib/utils";
import { CornerRightUp, Paperclip, Pause } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Button } from "ui/button";
import { notImplementedToast } from "ui/shared-toast";
import { PastesContentCard } from "./pasts-content";
import { UseChatHelpers } from "@ai-sdk/react";
import { SelectModel } from "./select-model";
import { appStore } from "@/app/store";
import { useShallow } from "zustand/shallow";
import { customModelProvider } from "lib/ai/models";

interface PromptInputProps {
  placeholder?: string;
  setInput?: (value: string) => void;
  input?: string;
  onSubmit?: UseChatHelpers["handleSubmit"];
  onStop?: () => void;
  append?: UseChatHelpers["append"];
  threadId: string;
  isLoading?: boolean;
}

export default function PromptInput({
  placeholder = "Type a message...",
  threadId,
  input = "",
  setInput,
  onSubmit,
  append,
  onStop,
  isLoading,
}: PromptInputProps) {
  const [appStoreMutate, model] = appStore(
    useShallow((state) => [state.mutate, state.model]),
  );
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const modelList = useMemo(() => {
    return customModelProvider.modelsInfo;
  }, []);

  const [pastedContents, setPastedContents] = useState<string[]>([]);

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text/plain");
    if (text.length > 500) {
      setPastedContents([...pastedContents, text]);
      e.preventDefault();
    }
  };

  const submit = () => {
    if (!editorRef.current) return;
    const chatPath = `/chat/${threadId}`;
    if (window.location.pathname !== chatPath) {
      window.history.replaceState({}, "", chatPath);
    }
    const userMessage = input.trim();
    const pastedContentsParsed = pastedContents.map((content) => ({
      type: "text" as const,
      text: content,
    }));
    setInput?.("");
    setPastedContents([]);
    editorRef.current.style.height = "";
    append!({
      role: "user",
      content: "",
      parts: [
        ...pastedContentsParsed,
        {
          type: "text",
          text: userMessage,
        },
      ],
    });
  };

  const handleInput = () => {
    if (editorRef.current) {
      setInput?.(editorRef.current.value ?? "");
      editorRef.current.style.height = "0";
      editorRef.current.style.height = editorRef.current.scrollHeight + "px";
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      input.length > 0 &&
      e.key === "Enter" &&
      !e.shiftKey &&
      !e.nativeEvent.isComposing
    ) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.1 }}
    >
      <div
        className="z-10 mx-auto w-full max-w-3xl relative"
        onClick={() => editorRef.current?.focus()}
      >
        <fieldset className="flex w-full min-w-0 max-w-full flex-col px-2">
          <div className="rounded-4xl backdrop-blur-sm transition-all duration-200 shadow-lg dark:bg-muted/20 bg-muted/40 border-dashed relative flex w-full flex-col cursor-text z-10 border border-muted items-stretch focus-within:border-muted-foreground hover:border-muted-foreground p-3">
            <div className="flex flex-col gap-3.5 px-1">
              <div className="relative">
                <textarea
                  ref={editorRef}
                  value={input}
                  placeholder={placeholder}
                  className="w-full max-h-96 min-h-[4rem] break-words overflow-y-auto resize-none focus:outline-none px-2 py-1"
                  onKeyDown={handleKeyDown}
                  onInput={handleInput}
                  onPaste={handlePaste}
                />
              </div>
              <div className="flex w-full items-center gap-2">
                {pastedContents.map((content, index) => (
                  <PastesContentCard
                    key={index}
                    initialContent={content}
                    deleteContent={() => {
                      setPastedContents((prev) => {
                        const newContents = [...prev];
                        newContents.splice(index, 1);
                        return newContents;
                      });
                    }}
                    updateContent={(content) => {
                      setPastedContents((prev) => {
                        const newContents = [...prev];
                        newContents[index] = content;
                        return newContents;
                      });
                    }}
                  />
                ))}
              </div>
              <div className="flex w-full items-center z-30">
                <Button
                  variant="ghost"
                  size="icon"
                  className="cursor-pointer"
                  onClick={notImplementedToast}
                >
                  <Paperclip />
                </Button>

                <SelectModel
                  onSelect={(model) => {
                    appStoreMutate({ model });
                  }}
                  providers={modelList}
                  model={model}
                >
                  <Button size={"sm"} variant={"ghost"}>
                    {model}
                    {/* <ChevronsUpDown /> */}
                  </Button>
                </SelectModel>
                <div className="flex-1" />

                <Button
                  onClick={() => {
                    if (isLoading) {
                      onStop?.();
                    } else {
                      submit();
                    }
                  }}
                  variant="ghost"
                  size="icon"
                  className={cn(
                    input.length > 0
                      ? "text-foreground"
                      : "text-muted-foreground",
                    "cursor-pointer rounded-xl",
                  )}
                >
                  {isLoading ? (
                    <Pause
                      size={16}
                      className="fill-muted-foreground text-muted-foreground"
                    />
                  ) : (
                    <CornerRightUp size={16} />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </fieldset>
      </div>
    </motion.div>
  );
}
