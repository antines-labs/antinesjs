import {
  StringSchema,
  NumberSchema,
  BooleanSchema,
  EnumSchema,
  DateSchema,
  ArraySchema,
  ObjectSchema,
  NullableSchema,
  OptionalSchema,
} from "./builders.js";
import type { SchemaNode, FieldDef } from "./builders.js";
import { serialize } from "./serialize.js";

export {
  StringSchema,
  NumberSchema,
  BooleanSchema,
  EnumSchema,
  DateSchema,
  ArraySchema,
  ObjectSchema,
  NullableSchema,
  OptionalSchema,
};
export type { SchemaNode, FieldDef };

export { serialize };
export type {
  SchemaIR,
  StringIR,
  NumberIR,
  BooleanIR,
  EnumIR,
  DateIR,
  ArrayIR,
  ObjectIR,
  FieldIR,
  NullableIR,
  OptionalIR,
} from "./serialize.js";

/**
 * Schema DSL — entry point for defining schemas.
 *
 * ```ts
 * import { s } from '@antinesjs/schema'
 *
 * const User = s.object({
 *   name: s.string().min(2).max(100),
 *   email: s.string().email(),
 *   role: s.enum(['admin', 'member']),
 * })
 *
 * const ir = s.serialize(User)
 * ```
 */
export const s = {
  string: () => new StringSchema(),
  number: () => new NumberSchema(),
  boolean: () => new BooleanSchema(),
  enum: (values: string[]) => new EnumSchema(values),
  date: () => new DateSchema(),
  array: (items: SchemaNode) => new ArraySchema(items),
  object: (fields: Record<string, SchemaNode | FieldDef>) => new ObjectSchema(fields),
  nullable: (inner: SchemaNode) => new NullableSchema(inner),
  optional: (inner: SchemaNode) => new OptionalSchema(inner),
  serialize,
};
