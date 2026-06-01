import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { generate } from "./generate.js";
import { findGoRuntime, findBun, findWorkerEntry } from "../utils/go-runtime.js";

export interface DevOptions {
  port: string;
  workers: string;
  timeout: string;
  routesDir: string;
}

export async function dev(opts: DevOptions) {
  const cwd = process.cwd();
  const manifest = resolve(cwd, ".antines", "manifest.json");

  console.log("[antines] Generating manifest...");
  await generate({ routesDir: opts.routesDir, outFile: manifest });

  const goRuntime = findGoRuntime();
  const bun = findBun();
  const workerEntry = findWorkerEntry();

  console.log(`[antines] Starting dev server on port ${opts.port}...`);

  // spawn Go runtime
  const proc = spawn(goRuntime, [
    `--port=${opts.port}`,
    `--workers=${opts.workers}`,
    `--timeout=${opts.timeout}`,
    `--manifest=${manifest}`,
    `--worker-entry=${workerEntry}`,
    `--bun=${bun}`,
  ], {
    stdio: "inherit",
    cwd,
  });

  proc.on("exit", (code) => {
    process.exit(code ?? 0);
  });

  process.on("SIGTERM", () => proc.kill());
  process.on("SIGINT", () => proc.kill());
}
