import { writeFileSync } from "fs";
import { MCP_CONFIG_PATH } from "lib/const";

const DEFAULT_CONFIG = {
  "my-custom-server": {
    command: "tsx",
    args: ["custom-mcp-server"],
  },
};

try {
  writeFileSync(MCP_CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
  console.log("✅ .mcp-config.json has been generated successfully");
} catch (error) {
  console.error("❌ Failed to generate .mcp-config.json:", error);
  process.exit(1);
}
