export interface StringValidations {
  min?: number
  max?: number
  email?: boolean
  uuid?: boolean
  url?: boolean
  pattern?: string
}

export interface NumberValidations {
  int?: boolean
  min?: number
  max?: number
  positive?: boolean
  negative?: boolean
}

export interface DateValidations {
  min?: string
  max?: string
}

export interface ArrayValidations {
  min?: number
  max?: number
  unique?: boolean
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
  | OptionalSchema

export interface FieldDef {
  schema: SchemaNode
  optional?: boolean
  nullable?: boolean
  description?: string
  default?: unknown
}

export class StringSchema {
  readonly type = 'string' as const
  validations: StringValidations = {}

  min(n: number): this {
    this.validations.min = n
    return this
  }

  max(n: number): this {
    this.validations.max = n
    return this
  }

  email(): this {
    this.validations.email = true
    return this
  }

  uuid(): this {
    this.validations.uuid = true
    return this
  }

  url(): this {
    this.validations.url = true
    return this
  }

  pattern(r: string): this {
    this.validations.pattern = r
    return this
  }
}

export class NumberSchema {
  readonly type = 'number' as const
  validations: NumberValidations = {}

  int(): this {
    this.validations.int = true
    return this
  }

  min(n: number): this {
    this.validations.min = n
    return this
  }

  max(n: number): this {
    this.validations.max = n
    return this
  }

  positive(): this {
    this.validations.positive = true
    return this
  }

  negative(): this {
    this.validations.negative = true
    return this
  }
}

export class BooleanSchema {
  readonly type = 'boolean' as const
}

export class EnumSchema {
  readonly type = 'enum' as const
  values: string[]

  constructor(values: string[]) {
    if (values.length === 0) {
      throw new Error('Enum must have at least one value')
    }
    this.values = values
  }
}

export class DateSchema {
  readonly type = 'date' as const
  validations: DateValidations = {}

  min(iso: string): this {
    this.validations.min = iso
    return this
  }

  max(iso: string): this {
    this.validations.max = iso
    return this
  }
}

export class ArraySchema {
  readonly type = 'array' as const
  items: SchemaNode
  validations: ArrayValidations = {}

  constructor(items: SchemaNode) {
    this.items = items
  }

  min(n: number): this {
    this.validations.min = n
    return this
  }

  max(n: number): this {
    this.validations.max = n
    return this
  }

  unique(): this {
    this.validations.unique = true
    return this
  }
}

export class ObjectSchema {
  readonly type = 'object' as const
  fields: Record<string, SchemaNode | FieldDef>
  _strict: boolean = false

  constructor(fields: Record<string, SchemaNode | FieldDef>) {
    this.fields = fields
  }

  strict(): this {
    this._strict = true
    return this
  }
}

export class NullableSchema {
  readonly type = 'nullable' as const
  inner: SchemaNode

  constructor(inner: SchemaNode) {
    this.inner = inner
  }
}

export class OptionalSchema {
  readonly type = 'optional' as const
  inner: SchemaNode

  constructor(inner: SchemaNode) {
    this.inner = inner
  }
}
