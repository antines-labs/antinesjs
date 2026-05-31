import type { SchemaNode } from "@antines/schema";

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

export interface RouteConfig<In = Record<string, unknown>, Out = Record<string, unknown>> {
  schema: RouteSchema;
  handler?: (ctx: In) => Promise<Out>;
}

// ---- TypeOf helper ----

type TypeOf<T> = T extends { _type: infer U } ? U : Record<string, unknown>;

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
 *     return { id: '123' }
 *   },
 * })
 * ```
 */
export function defineRoute<In, Out>(config: {
  schema: {
    input?: In;
    output?: Out;
    errors?: Record<string, ErrorDef>;
  };
  handler?: (ctx: TypeOf<In>) => Promise<TypeOf<Out>>;
}): RouteConfig<TypeOf<In>, TypeOf<Out>> {
  if (!config.schema) {
    throw new Error("defineRoute: schema is required");
  }
  return config as unknown as RouteConfig<TypeOf<In>, TypeOf<Out>>;
}
