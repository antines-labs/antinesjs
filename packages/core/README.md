# @antines/core

Route definition, file scanning, and manifest generation for Antines. Provides `defineRoute` with full type inference from schema builders, and `generateManifest` which scans a routes directory and produces the `antines-manifest.json` consumed by the Go runtime.

## Usage

```ts
import { s } from "@antines/schema";
import { defineRoute } from "@antines/core";

export default defineRoute({
  schema: {
    input: s.object({
      name: s.string().min(2),
    }),
    output: s.object({
      id: s.string().uuid(),
      name: s.string(),
    }),
  },
  handler: async (ctx) => {
    return { id: crypto.randomUUID(), name: ctx.name };
  },
});
```

The handler's `ctx` parameter is typed from the input schema, and the return type is checked against the output schema.

## API

| Export | Description |
|---|---|
| `defineRoute(config)` | Defines a route with schema and optional handler. Schema types flow into handler types. |
| `scanRouteFile(relativePath)` | Parses a route filename like `users.[id].get.ts` into `{ method, path, params }` |
| `generateManifest(options)` | Scans `routesDir` for `.ts` files, imports each, serializes schemas, writes `antines-manifest.json` |
| `Manifest`, `RouteManifest` | Manifest JSON types |
| `RouteConfig`, `RouteSchema`, `ErrorDef` | Route configuration types |

## License

MIT
