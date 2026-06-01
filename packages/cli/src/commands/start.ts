import type { DevOptions } from "./dev.js";
import { dev } from "./dev.js";

export interface StartOptions extends DevOptions {}

export async function start(opts: StartOptions) {
  // In production mode, we skip the dev console output
  // but the behavior is the same for now.
  // Future: add no-watch, daemonize, health check, etc.
  console.log("[antines] Starting production server...");
  await dev(opts);
}
