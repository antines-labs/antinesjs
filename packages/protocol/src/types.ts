// Mirrors Go's FieldType
export enum FieldType {
  String = 0,
  Number = 1,
  Boolean = 2,
  Enum = 3,
  Date = 4,
  Array = 5,
  Object = 6,
}

// Mirrors Go's FieldCategory
export enum FieldCategory {
  Fixed = 0,
  Variable = 1,
}

// Mirrors Go's FieldLayout
export interface FieldLayout {
  name: string
  fieldType: FieldType
  category: FieldCategory
  offset: number    // byte offset in fixed section, or index in offset table
  size: number      // byte size (0 for variable fields)
  bitmaskBit: number // -1 if not optional
  isOptional: boolean
  isNullable: boolean
}

// Mirrors Go's CompiledLayout
export interface CompiledLayout {
  fields: FieldLayout[]
  fixedSize: number
  bitmaskSize: number
  variableCount: number
}

// Mirrors Go's Header
export enum Direction {
  GoToJS = 0x00,
  JSToGo = 0x01,
}

export enum MessageType {
  Dispatch = 0x00,
  Result = 0x01,
  Ping = 0x02,
  Error = 0x03,
}

export interface Header {
  magic: number       // 0x414E5453
  version: number     // 0x01
  direction: Direction
  msgType: MessageType
  flags: number
  requestId: number
  handlerId: number
  payloadLen: number
  statusCode: number
  reserved: Uint8Array
}

export const MAGIC = 0x414E5453
export const HEADER_SIZE = 32
export const SENTINEL_ABSENT = 0xFFFFFFFF
