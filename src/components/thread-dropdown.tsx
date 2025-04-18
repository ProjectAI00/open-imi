"use client";
import { deleteThreadAction, updateThreadAction } from "@/app/api/chat/actions";
import { appStore } from "@/app/store";
import { useLatest } from "@/hooks/use-latest";
import { Loader2, PencilLine, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { type PropsWithChildren, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { safe } from "ts-safe";
import { Button } from "ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { Input } from "ui/input";

type Props = PropsWithChildren<{
  threadId: string;
  beforeTitle?: string;
}>;

export function ThreadDropdown({ threadId, children, beforeTitle }: Props) {
  const router = useRouter();

  const push = useLatest(router.push);

  const currentThreadId = appStore((state) => state.currentThreadId);

  const [title, setTitle] = useState(beforeTitle ?? "");

  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdate = async () => {
    safe()
      .ifOk(() => {
        if (!title) {
          throw new Error("Title is required");
        }
      })
      .ifOk(() => updateThreadAction({ id: threadId, title }))
      .ifOk(() => mutate("threads"))
      .watch(({ isOk, error }) => {
        if (isOk) {
          toast.success("Thread updated");
        } else {
          toast.error(error.message || "Failed to update thread");
        }
      });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    safe()
      .watch(() => setIsDeleting(true))
      .ifOk(() => deleteThreadAction(threadId))
      .watch(() => setIsDeleting(false))
      .watch(({ isOk, error }) => {
        if (isOk) {
          toast.success("Thread deleted");
        } else {
          toast.error(error.message || "Failed to delete thread");
        }
      })
      .ifOk(() => {
        if (currentThreadId === threadId) {
          push.current("/");
        }
        mutate("threads");
      })
      .unwrap();
  };

  return (
    <Dialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            <PencilLine />
            <DialogTrigger>ReName</DialogTrigger>
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash />
            Delete
            {isDeleting && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent hideClose>
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            <Input
              type="text"
              value={title}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleUpdate();
                }
              }}
              onInput={(e) => {
                setTitle(e.currentTarget.value);
              }}
            />
          </DialogDescription>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="outline" onClick={handleUpdate}>
                Update
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
