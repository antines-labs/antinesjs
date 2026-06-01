import { existsSync } from "node:fs";
import { ok } from "node:assert";

export interface RuntimeOptions {
  port: string;
  workers: string;
  timeout: string;
  manifest: string;
  workerEntry: string;
  bun?: string;
}

export function findGoRuntime(): string {
  const candidates = [
    "antines-dev",
    "antines",
  ];

  for (const name of candidates) {
    const which = findInPath(name);
    if (which) return which;
  }

  throw new Error(
    "antines-dev not found in PATH.\n" +
    "Install it first:\n" +
    "  cd core && make build-dev",
  );
}

export function findBun(): string {
  const which = findInPath("bun");
  ok(which, "bun not found in PATH");
  return which;
}

export function findWorkerEntry(): string {
  const candidates = [
    "./node_modules/@antines/worker/dist/entry.js",
    "./node_modules/@antines/worker/src/entry.ts",
    "./worker-entry.ts",
    "./worker-entry.js",
  ];

  for (const path of candidates) {
    if (existsSync(path)) return path;
  }

  throw new Error(
    "Could not find worker entry point.\n" +
    "Install @antines/worker:  bun add @antines/worker",
  );
}

function findInPath(name: string): string | undefined {
  const envPath = process.env.PATH ?? "";
  for (const dir of envPath.split(":")) {
    const full = `${dir}/${name}`;
    if (existsSync(full)) return full;
  }
}
