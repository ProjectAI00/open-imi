import { motion } from "framer-motion";

import { MCPIcon } from "ui/mcp-icon";

export const Greeting = () => {
  return (
    <motion.div
      key="welcome"
      className="max-w-3xl mx-auto my-10 md:my-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.3 }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-6 leading-relaxed text-center">
        <div className="flex justify-center">
          <div className="bg-foreground rounded-lg p-2">
            <MCPIcon className="size-6 fill-background" />
          </div>
        </div>
        <h1 className="text-4xl font-bold">Welcome to MCP Client Chatbot!</h1>

        <div className="text-muted-foreground text-xs">
          <p className="mb-3">
            I can help you with various tasks using powerful AI tools through
            MCP integration.
          </p>

          <p>
            You can configure MCP tools at{" "}
            <a
              href="/mcp"
              className="underline text-primary hover:text-primary/80"
            >
              /mcp
            </a>{" "}
            or by editing the{" "}
            <code className="bg-muted px-1 py-0.5 rounded">
              .mcp-config.json
            </code>{" "}
            file.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
