import { readdirSync, writeFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { serialize } from "@antines/schema";
import type { SchemaIR } from "@antines/schema";
import { scanRouteFile } from "./scanner.js";
import type { RouteConfig, ErrorDef } from "./define-route.js";

// ---- Manifest types ----

export interface RouteManifest {
  method: string;
  path: string;
  handlerId: number;
  handlerFile: string;
  hasHandler: boolean;
  params: string[];
  schema: {
    input?: SchemaIR;
    output?: SchemaIR;
    errors?: Record<string, ErrorDef>;
  };
}

export interface Manifest {
  version: number;
  routes: RouteManifest[];
}

// ---- Generator ----

export interface GenerateOptions {
  /** Absolute path to the routes directory */
  routesDir: string;
  /** Absolute path to write the manifest (optional — if not provided, returns the object) */
  outFile?: string;
  /** Base path to resolve imports (normally the project root, optional) */
  baseDir?: string;
}

/**
 * Generates the antines-manifest.json from the route files.
 * The system scans the routes directory recursively,
 * processing each TypeScript file by parsing the HTTP method, path, and parameters from the filename.
 * The system scans the routes directory recursively, processing each TypeScript file by parsing the HTTP method, path, and parameters from the filename.
 * It then dynamically imports each module, extracting the schema and handler from the default export.
 * Schemas are serialized using s.serialize(), handler IDs are assigned, and the result is written to a manifest.json file or returned as an object.
 */
export async function generateManifest(options: GenerateOptions): Promise<Manifest> {
  const { routesDir } = options;

  if (!existsSync(routesDir)) {
    throw new Error(`Routes directory not found: ${routesDir}`);
  }

  const routeFiles = findTsFiles(routesDir);

  if (routeFiles.length === 0) {
    throw new Error(`No route files found in ${routesDir}`);
  }

  let handlerId = 0;
  const routes: RouteManifest[] = [];

  for (const absolutePath of routeFiles) {
    handlerId++;

    const relPath = relative(routesDir, absolutePath);
    const basePath = options.baseDir ? relative(options.baseDir, absolutePath) : relPath;
    const scanned = scanRouteFile(relPath);

    const mod = await import(absolutePath);
    const defaultExport = mod.default as RouteConfig | undefined;

    if (!defaultExport || !defaultExport.schema) {
      throw new Error(`Route file "${relPath}" must export a default defineRoute() call`);
    }

    const { schema, handler } = defaultExport;
    const hasHandler = typeof handler === "function";

    const routeManifest: RouteManifest = {
      method: scanned.method,
      path: scanned.path,
      handlerId,
      handlerFile: basePath,
      hasHandler,
      params: scanned.params,
      schema: {},
    };

    if (schema.input) {
      routeManifest.schema.input = serialize(schema.input);
    }
    if (schema.output) {
      routeManifest.schema.output = serialize(schema.output);
    }
    if (schema.errors) {
      routeManifest.schema.errors = schema.errors;
    }

    routes.push(routeManifest);
  }

  const manifest: Manifest = {
    version: 1,
    routes,
  };

  if (options.outFile) {
    writeFileSync(options.outFile, JSON.stringify(manifest, null, 2), "utf-8");
  }

  return manifest;

  // ---- Helpers ----

  function findTsFiles(dir: string): string[] {
    const result: string[] = [];
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        result.push(...findTsFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith(".ts")) {
        result.push(fullPath);
      }
    }
    result.sort();
    return result;
  }
}
