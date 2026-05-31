export { calculateLayout } from './layout.js'
export { encodeHeader, decodeHeader, readHeader, newHeader } from './header.js'
export { serializeOutput, deserializeInput } from './serialize.js'

export {
  FieldType,
  FieldCategory,
  Direction,
  MessageType,
  MAGIC,
  HEADER_SIZE,
  SENTINEL_ABSENT,
} from './types.js'
export type {
  FieldLayout,
  CompiledLayout,
  Header,
} from './types.js'
