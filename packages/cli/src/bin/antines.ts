#!/usr/bin/env bun
import { parseArgs } from "node:util";
import { generate } from "../commands/generate.js";
import { dev } from "../commands/dev.js";
import { start } from "../commands/start.js";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    port: { type: "string", short: "p", default: "3000" },
    workers: { type: "string", short: "w", default: "2" },
    timeout: { type: "string", short: "t", default: "30s" },
    routes: { type: "string", short: "r", default: "./routes" },
  },
});

const command = positionals[0];
if (!command) {
  console.log("Usage: antines <command> [options]");
  console.log("");
  console.log("Commands:");
  console.log("  generate     Generate manifest from route files");
  console.log("  dev          Start development server with watch mode");
  console.log("  start        Start production server");
  console.log("");
  console.log("Options:");
  console.log("  -p, --port       Server port (default: 3000)");
  console.log("  -w, --workers    Number of JS workers (default: 2)");
  console.log("  -t, --timeout    Worker timeout (default: 30s)");
  console.log("  -r, --routes     Routes directory (default: ./routes)");
  process.exit(0);
}

switch (command) {
  case "generate": {
    await generate({ routesDir: values.routes });
    break;
  }
  case "dev": {
    await dev({
      port: values.port,
      workers: values.workers,
      timeout: values.timeout,
      routesDir: values.routes,
    });
    break;
  }
  case "start": {
    await start({
      port: values.port,
      workers: values.workers,
      timeout: values.timeout,
      routesDir: values.routes,
    });
    break;
  }
  default: {
    console.error(`Unknown command: ${command}`);
    process.exit(1);
  }
}
