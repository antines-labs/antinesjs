import { OptionalSchema, NullableSchema } from "./builders.js";
import type {
  SchemaNode,
  StringSchema,
  NumberSchema,
  EnumSchema,
  DateSchema,
  ArraySchema,
  ObjectSchema,
  FieldDef,
  StringValidations,
  NumberValidations,
  DateValidations,
  ArrayValidations,
} from "./builders.js";

// ---- Schema IR JSON types ----

export interface StringIR {
  type: "string";
  validations: StringValidations;
}

export interface NumberIR {
  type: "number";
  validations: NumberValidations;
}

export interface BooleanIR {
  type: "boolean";
}

export interface EnumIR {
  type: "enum";
  values: string[];
}

export interface DateIR {
  type: "date";
  validations: DateValidations;
}

export interface ArrayIR {
  type: "array";
  items: SchemaIR;
  validations: ArrayValidations;
}

export interface FieldIR {
  schema: SchemaIR;
  optional: boolean;
  nullable: boolean;
  description?: string;
}

export interface ObjectIR {
  type: "object";
  fields: Record<string, FieldIR>;
  strict: boolean;
}

export interface NullableIR {
  type: "nullable";
  inner: SchemaIR;
}

export interface OptionalIR {
  type: "optional";
  inner: SchemaIR;
}

export type SchemaIR =
  | StringIR
  | NumberIR
  | BooleanIR
  | EnumIR
  | DateIR
  | ArrayIR
  | ObjectIR
  | NullableIR
  | OptionalIR;

// ---- Serializer ----

function serializeField(val: SchemaNode | FieldDef): FieldIR {
  if ("schema" in val && val.schema !== undefined) {
    const def = val as FieldDef;
    return {
      schema: serialize(def.schema),
      optional: def.optional ?? false,
      nullable: def.nullable ?? false,
      description: def.description,
    };
  }

  const node = val as SchemaNode;

  if (node instanceof OptionalSchema) {
    return {
      schema: serialize(node.inner),
      optional: true,
      nullable: false,
    };
  }

  if (node instanceof NullableSchema) {
    return {
      schema: serialize(node.inner),
      optional: false,
      nullable: true,
    };
  }

  return {
    schema: serialize(node),
    optional: false,
    nullable: false,
  };
}

export function serialize(node: SchemaNode): SchemaIR {
  switch (node.type) {
    case "string": {
      const n = node as StringSchema;
      return {
        type: "string",
        validations: { ...n.validations },
      } satisfies StringIR;
    }

    case "number": {
      const n = node as NumberSchema;
      return {
        type: "number",
        validations: { ...n.validations },
      } satisfies NumberIR;
    }

    case "boolean": {
      return { type: "boolean" } satisfies BooleanIR;
    }

    case "enum": {
      const n = node as EnumSchema;
      return {
        type: "enum",
        values: [...n.values],
      } satisfies EnumIR;
    }

    case "date": {
      const n = node as DateSchema;
      return {
        type: "date",
        validations: { ...n.validations },
      } satisfies DateIR;
    }

    case "array": {
      const n = node as ArraySchema;
      return {
        type: "array",
        items: serialize(n.items),
        validations: { ...n.validations },
      } satisfies ArrayIR;
    }

    case "object": {
      const n = node as ObjectSchema;
      const fields: Record<string, FieldIR> = {};
      for (const key of Object.keys(n.fields)) {
        const val = n.fields[key];
        if (val === undefined) continue;
        fields[key] = serializeField(val);
      }
      return {
        type: "object",
        fields,
        strict: n._strict,
      } satisfies ObjectIR;
    }

    case "nullable": {
      const n = node as NullableSchema;
      return {
        type: "nullable",
        inner: serialize(n.inner),
      } satisfies NullableIR;
    }

    case "optional": {
      const n = node as OptionalSchema;
      return {
        type: "optional",
        inner: serialize(n.inner),
      } satisfies OptionalIR;
    }

    default:
      throw new Error(`Unknown schema type: ${(node as SchemaNode).type}`);
  }
}
