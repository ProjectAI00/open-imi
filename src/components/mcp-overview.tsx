import { Button } from "./ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export function MCPOverview() {
  return (
    <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-12 text-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="rounded-full bg-primary/10 p-3">
          <PlusCircle className="h-12 w-12 text-primary" />
        </div>

        <h3 className="text-xl font-semibold">No MCP Servers Added</h3>

        <p className="text-muted-foreground max-w-md">
          MCP servers allow you to connect to external AI providers. Add your
          first MCP server to get started.
        </p>

        <div className="bg-muted p-4 rounded-md text-sm max-w-lg">
          <p className="mb-2 font-medium">Getting Started:</p>
          <ul className="list-disc pl-5 space-y-1 text-left">
            <li>Click the (Add MCP Server) button above</li>
            <li>Configure your server connection (SSE or STDIO)</li>
            <li>Provide required information like URL or command</li>
            <li>Save your configuration and start using connected tools</li>
          </ul>
          <p className="mt-3 text-xs">
            Need help? Check our{" "}
            <a href="#" className="text-primary underline">
              documentation
            </a>{" "}
            for detailed setup instructions.
          </p>
        </div>

        <Link href="/mcp/create">
          <Button className="mt-2">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add MCP Server
          </Button>
        </Link>
      </div>
    </div>
  );
}
