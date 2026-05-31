import { generateManifest } from "@antinesjs/core";
import { resolve } from "node:path";

const appDir = resolve(import.meta.dirname, "..");
const routesDir = resolve(appDir, "routes");
const outFile = resolve(appDir, "antines-manifest.json");

const manifest = await generateManifest({ routesDir, outFile, baseDir: appDir });
console.log(`Manifest generated: ${outFile}`);
console.log(`  Routes: ${manifest.routes.length}`);
for (const r of manifest.routes) {
  console.log(`  ${r.method} ${r.path} → handlerId=${r.handlerId} hasHandler=${r.hasHandler}`);
}
