"use client";

import logger from "logger";
import { toast } from "sonner";
import JsonView from "ui/json-view";

export const notImplementedToast = () => {
  toast.warning("Not implemented yet 🤣");
};

export const handleErrorWithToast = (error: Error, id?: string) => {
  logger.error(error);
  toast.error(`${error.name}`, {
    description: (
      <div className="my-4 max-h-[340px] overflow-y-auto">
        <JsonView
          data={{
            name: error.name,
            message:
              error.name === "ZodError"
                ? JSON.parse(error.message)
                : error.message,
          }}
        />
      </div>
    ),
    id,
  });

  return error;
};
