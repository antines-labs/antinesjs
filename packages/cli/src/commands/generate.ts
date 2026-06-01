import { resolve, relative } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { generateManifest } from "@antines/core";

export interface GenerateOptions {
  routesDir: string;
  outFile?: string;
}

export async function generate(opts: GenerateOptions) {
  const cwd = process.cwd();
  const routesDir = resolve(cwd, opts.routesDir);

  if (!existsSync(routesDir)) {
    console.error(`Routes directory not found: ${routesDir}`);
    process.exit(1);
  }

  const outDir = resolve(cwd, ".antines");
  const outFile = opts.outFile ?? resolve(outDir, "manifest.json");

  mkdirSync(outDir, { recursive: true });

  const manifest = await generateManifest({
    routesDir,
    outFile,
    baseDir: cwd,
  });

  const rel = relative(cwd, outFile);
  console.log(`Manifest generated: ${rel}`);
  console.log(`  Routes: ${manifest.routes.length}`);
  for (const r of manifest.routes) {
    console.log(`  ${r.method} ${r.path} → handlerId=${r.handlerId} hasHandler=${r.hasHandler}`);
  }
}
