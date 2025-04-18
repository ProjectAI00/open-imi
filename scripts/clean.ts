import { rimraf } from "rimraf";

async function clean() {
  try {
    console.log("🧹 Cleaning up...");

    // Remove .next directory
    await rimraf(".next");
    console.log("✅ Removed .next directory");

    // Remove node_modules directory
    await rimraf("node_modules");
    console.log("✅ Removed node_modules directory");

    console.log("✨ Cleanup completed successfully!");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  }
}

clean();
