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
  enum: <const T extends readonly string[]>(values: T) => new EnumSchema(values),
  date: () => new DateSchema(),
  array: <T extends SchemaNode>(items: T) => new ArraySchema<T>(items),
  object: <T extends Record<string, SchemaNode | FieldDef>>(fields: T) => new ObjectSchema<T>(fields),
  nullable: <T extends SchemaNode>(inner: T) => new NullableSchema<T>(inner),
  optional: <T extends SchemaNode>(inner: T) => new OptionalSchema<T>(inner),
  serialize,
};
