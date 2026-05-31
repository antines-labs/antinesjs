# @antines/schema

Fluent schema definition DSL for Antines. Schema builders provide chainable validation methods and phantom-type inference for end-to-end type safety. Serialized to SchemaIR JSON consumed by the Go runtime at startup.

## Usage

```ts
import { s } from "@antines/schema";

const schema = s.object({
  name: s.string().min(2).max(100),
  email: s.string().email(),
  age: { schema: s.number().int(), optional: true },
});

const ir = s.serialize(schema);
```

## Builders

| Builder | Methods |
|---|---|
| `s.string()` | `.min(n)`, `.max(n)`, `.email()`, `.uuid()`, `.url()`, `.pattern(r)` |
| `s.number()` | `.int()`, `.min(n)`, `.max(n)`, `.positive()`, `.negative()` |
| `s.boolean()` | — |
| `s.enum(values)` | `const T[]` — typed enum |
| `s.date()` | `.min(iso)`, `.max(iso)` |
| `s.array(items)` | `.min(n)`, `.max(n)`, `.unique()` |
| `s.object(fields)` | `.strict()` — enables strict mode (no extra fields) |
| `s.nullable(inner)` | Wraps a builder as nullable |
| `s.optional(inner)` | Wraps a builder as optional |

## Serialization

`s.serialize(node)` converts a schema builder tree into SchemaIR JSON. The IR is a plain JSON structure with types like `StringIR`, `ObjectIR`, `NullableIR`, etc.

## License

MIT
