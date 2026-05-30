import type { SchemaNode } from "@antinesjs/schema";

// ---- Types ----

export interface ErrorDef {
  status: number;
  message: string;
}

export interface RouteSchema {
  input?: SchemaNode;
  output?: SchemaNode;
  errors?: Record<string, ErrorDef>;
}

export interface RouteConfig {
  schema: RouteSchema;
  handler?: (ctx: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

// ---- defineRoute ----

/**
 * Define a route with an optional scheme and handler.
 * The scheme is used for validation in Go and for type inference.
 *
 * ```ts
 * export default defineRoute({
 *   schema: {
 *     input: s.object({ name: s.string() }),
 *     output: s.object({ id: s.string() }),
 *   },
 *   handler: async (ctx) => {
 *     return ctx.ok({ id: '123' })
 *   },
 * })
 * ```
 */
export function defineRoute(config: RouteConfig): RouteConfig {
  if (!config.schema) {
    throw new Error("defineRoute: schema is required");
  }
  return config;
}
