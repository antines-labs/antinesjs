import { parseArgs } from "node:util";
import { WorkerRuntime } from "./runtime.js";

const { socket, manifest } = parseArgs({
  options: {
    socket: { type: "string", required: true },
    manifest: { type: "string", required: true },
  },
}).values as { socket: string; manifest: string };

const runtime = new WorkerRuntime();

process.on("SIGTERM", () => {
  runtime.stop();
  process.exit(0);
});

process.on("SIGINT", () => {
  runtime.stop();
  process.exit(0);
});

try {
  await runtime.start(socket, manifest, process.cwd());
} catch (err) {
  console.error("Worker failed:", err);
  process.exit(1);
}
