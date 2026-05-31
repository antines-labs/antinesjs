# Antines

**Antines** is a hybrid Go + JavaScript/TypeScript backend framework. The Go runtime handles HTTP, routing, validation, and infrastructure, while JavaScript workers execute business logic — each running in their own process with real debugging, full ecosystem access, and zero lock contention.

Communication between Go and JS happens over Unix sockets using a compact positional binary protocol. Schemas are defined once in TypeScript and serialized to a manifest that both sides consume at startup. Go validates all input against the schema; JavaScript receives pre-validated data and never re-validates.

This repository contains the JavaScript/TypeScript packages — the schema DSL, code generation, IPC protocol buffers, and worker runtime.

## Status

v0.1.0 — active development. The foundational pipeline is complete:

- **`@antines/schema`** — Fluent schema definition DSL (`s.string().min(2).email()`) with phantom-type inference for end-to-end type safety
- **`@antines/core`** — Manifest generator (`generateManifest`) that scans route files, imports handlers, serializes schemas to SchemaIR JSON
- **`@antines/protocol`** — Positional binary protocol implementation: header encode/decode, layout calculation, serialization/deserialization of fixed and variable fields
- **`@antines/worker`** — Worker runtime that connects to the Go server over Unix socket, dispatches incoming requests to route handlers, and sends responses back

## Quick start

```bash
# Install the packages in your project
bun add @antines/schema @antines/core @antines/protocol @antines/worker
```

Define a route with schema and handler:

```ts
// routes/hello.get.ts
import { s } from "@antines/schema";
import { defineRoute } from "@antines/core";

export default defineRoute({
  schema: {
    output: s.object({
      message: s.string(),
    }),
  },
  handler: async (_ctx) => {
    return { message: "Hello, World!" };
  },
});
```

Generate the manifest:

```bash
bun run scripts/generate-manifest.ts
```

Then start the Go server from the `core/` repository — see the [core README](https://github.com/antines-labs/core#quick-start) for instructions.

## Project structure

```
antinesjs/
├── apps/
│   └── example/          — Example application with route files
│       ├── routes/       — Route definitions (hello.get.ts, echo.post.ts, etc.)
│       ├── scripts/      — Manifest generation script
│       └── worker-entry.ts
├── packages/
│   ├── config/           — Shared TypeScript config (tsconfig.base.json)
│   ├── core/             — Code generation: route scanner, manifest builder, defineRoute
│   ├── protocol/         — Binary protocol: header, layout, serialization
│   ├── schema/           — Schema definition DSL and SchemaIR serializer
│   └── worker/           — Worker runtime: socket connection, dispatch, handler execution
└── package.json
```

## Packages

| Package | Description |
|---|---|
| `@antines/schema` | Fluent schema builders (`s.string().min(2).email()`) with serialization to SchemaIR JSON |
| `@antines/core` | Route scanner, manifest generator, `defineRoute` helper with full type inference |
| `@antines/protocol` | Positional binary IPC protocol: header, layout calculation, encode/decode |
| `@antines/worker` | Runtime that connects to Go over Unix socket and dispatches requests to handlers |

## License

MIT — see [LICENSE](LICENSE).
