import { WorkerRuntime } from "@antinesjs/worker";
import { parseArgs } from "node:util";

const args = parseArgs({
  options: {
    socket: { type: "string", required: true },
    manifest: { type: "string", required: true },
  },
});

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
  await runtime.start(args.values.socket!, args.values.manifest!);
} catch (err) {
  console.error("Worker failed:", err);
  process.exit(1);
}
