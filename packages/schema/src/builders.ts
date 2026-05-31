export interface StringValidations {
  min?: number;
  max?: number;
  email?: boolean;
  uuid?: boolean;
  url?: boolean;
  pattern?: string;
}

export interface NumberValidations {
  int?: boolean;
  min?: number;
  max?: number;
  positive?: boolean;
  negative?: boolean;
}

export interface DateValidations {
  min?: string;
  max?: string;
}

export interface ArrayValidations {
  min?: number;
  max?: number;
  unique?: boolean;
}

export type SchemaNode =
  | StringSchema
  | NumberSchema
  | BooleanSchema
  | EnumSchema
  | DateSchema
  | ArraySchema
  | ObjectSchema
  | NullableSchema
  | OptionalSchema;

export interface FieldDef {
  schema: SchemaNode;
  optional?: boolean;
  nullable?: boolean;
  description?: string;
  default?: unknown;
}

export class StringSchema {
  readonly type = "string" as const;
  declare readonly _type: string;
  validations: StringValidations = {};

  min(n: number): this {
    this.validations.min = n;
    return this;
  }

  max(n: number): this {
    this.validations.max = n;
    return this;
  }

  email(): this {
    this.validations.email = true;
    return this;
  }

  uuid(): this {
    this.validations.uuid = true;
    return this;
  }

  url(): this {
    this.validations.url = true;
    return this;
  }

  pattern(r: string): this {
    this.validations.pattern = r;
    return this;
  }
}

export class NumberSchema {
  readonly type = "number" as const;
  declare readonly _type: number;
  validations: NumberValidations = {};

  int(): this {
    this.validations.int = true;
    return this;
  }

  min(n: number): this {
    this.validations.min = n;
    return this;
  }

  max(n: number): this {
    this.validations.max = n;
    return this;
  }

  positive(): this {
    this.validations.positive = true;
    return this;
  }

  negative(): this {
    this.validations.negative = true;
    return this;
  }
}

export class BooleanSchema {
  readonly type = "boolean" as const;
  declare readonly _type: boolean;
}

export class EnumSchema<const T extends readonly string[] = string[]> {
  readonly type = "enum" as const;
  declare readonly _type: T[number];
  values: T[number][];

  constructor(values: T) {
    if (values.length === 0) {
      throw new Error("Enum must have at least one value");
    }
    this.values = [...values];
  }
}

export class DateSchema {
  readonly type = "date" as const;
  declare readonly _type: Date;
  validations: DateValidations = {};

  min(iso: string): this {
    this.validations.min = iso;
    return this;
  }

  max(iso: string): this {
    this.validations.max = iso;
    return this;
  }
}

export class ArraySchema<Item extends { _type: unknown } = SchemaNode> {
  readonly type = "array" as const;
  declare readonly _type: Item["_type"][];
  items: Item;
  validations: ArrayValidations = {};

  constructor(items: Item) {
    this.items = items;
  }

  min(n: number): this {
    this.validations.min = n;
    return this;
  }

  max(n: number): this {
    this.validations.max = n;
    return this;
  }

  unique(): this {
    this.validations.unique = true;
    return this;
  }
}

type InferFieldType<T> =
  T extends OptionalSchema<infer Inner>
    ? Inner["_type"] | undefined
    : T extends NullableSchema<infer Inner>
      ? Inner["_type"] | null
      : T extends { _type: infer U }
        ? U
        : T extends FieldDef
          ? (T["optional"] extends true ? T["schema"]["_type"] | undefined : T["schema"]["_type"])
            | (T["nullable"] extends true ? null : never)
          : never;

export class ObjectSchema<Fields = Record<string, SchemaNode | FieldDef>> {
  readonly type = "object" as const;
  declare readonly _type: { [K in keyof Fields]: InferFieldType<Fields[K]> };
  fields: Fields;
  _strict: boolean = false;

  constructor(fields: Fields) {
    this.fields = fields;
  }

  strict(): this {
    this._strict = true;
    return this;
  }
}

export class NullableSchema<Inner extends { _type: unknown } = SchemaNode> {
  readonly type = "nullable" as const;
  declare readonly _type: Inner["_type"] | null;
  inner: Inner;

  constructor(inner: Inner) {
    this.inner = inner;
  }
}

export class OptionalSchema<Inner extends { _type: unknown } = SchemaNode> {
  readonly type = "optional" as const;
  declare readonly _type: Inner["_type"] | undefined;
  inner: Inner;

  constructor(inner: Inner) {
    this.inner = inner;
  }
}
