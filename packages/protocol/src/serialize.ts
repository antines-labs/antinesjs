import {
  FieldType,
  FieldCategory,
  SENTINEL_ABSENT,
  type CompiledLayout,
  type FieldLayout,
} from './types.js'

/**
 * Serialize JS data (Record) into the positional wire format.
 * Mirrors Go's SerializeInput — used by JS worker to send results.
 */
export function serializeOutput(layout: CompiledLayout, data: Record<string, unknown>): ArrayBuffer {
  const bitmaskSize = layout.bitmaskSize
  const fixedSize = layout.fixedSize
  const varCount = layout.variableCount

  // pre-allocate with max possible size
  const offsetTableSize = varCount * 8
  const headerSize = bitmaskSize + fixedSize + offsetTableSize
  const buf = new ArrayBuffer(headerSize)
  const view = new DataView(buf)

  const bitmask = new Uint8Array(bitmaskSize)
  const variableOffsets = new Uint32Array(varCount)
  variableOffsets.fill(SENTINEL_ABSENT)
  const variableData: Uint8Array[] = []
  let variableDataTotal = 0

  let varIdx = 0
  for (const f of layout.fields) {
    const val = data[f.name]

    if (val === undefined || val === null) {
      if (f.isOptional) {
        if (f.category === FieldCategory.Variable) {
          varIdx++
        }
        continue
      }
    }

    if (f.isOptional && f.bitmaskBit >= 0 && (val !== undefined && val !== null)) {
      const byteIdx = Math.floor(f.bitmaskBit / 8)
      const bitIdx = f.bitmaskBit % 8
      bitmask[byteIdx]! |= 1 << bitIdx
    }

    if (f.category === FieldCategory.Fixed) {
      const offset = bitmaskSize + f.offset
      encodeFixedField(f, val, view, offset)
    }

    const enc = encodeVariableField(f, val)
    variableOffsets[varIdx] = variableDataTotal
    variableData.push(enc)
    variableDataTotal += enc.byteLength
    varIdx++
  }

  const totalSize = headerSize + variableDataTotal
  const finalBuf = new ArrayBuffer(totalSize)
  const finalView = new DataView(finalBuf)

  for (let i = 0; i < bitmaskSize; i++) {
    finalView.setUint8(i, bitmask[i] ?? 0)
  }

  if (fixedSize > 0) {
    const fixedSrc = new Uint8Array(buf, bitmaskSize, fixedSize)
    const fixedDst = new Uint8Array(finalBuf, bitmaskSize, fixedSize)
    fixedDst.set(fixedSrc)
  }

  let variableStart = bitmaskSize + fixedSize
  for (let i = 0; i < varCount; i++) {
    const start = variableOffsets[i]!
    const offset = variableStart + i * 8
    let length = 0
    if (start !== SENTINEL_ABSENT) {
      if (i + 1 < varCount && variableOffsets[i + 1] !== SENTINEL_ABSENT) {
        length = variableOffsets[i + 1]! - start
      } else {
        length = variableDataTotal - start
      }
    }
    finalView.setUint32(offset, start, true)
    finalView.setUint32(offset + 4, length, true)
  }

  if (variableDataTotal > 0) {
    const varDst = new Uint8Array(finalBuf, variableStart + varCount * 8)
    let pos = 0
    for (const chunk of variableData) {
      varDst.set(chunk, pos)
      pos += chunk.byteLength
    }
  }

  return finalBuf
}

/**
 * Deserialize the positional wire format into JS data (Record).
 * Mirrors Go's DeserializeOutput — used by JS worker to receive dispatches.
 */
export function deserializeInput(layout: CompiledLayout, data: ArrayBuffer): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  const view = new DataView(data)
  const bitmaskSize = layout.bitmaskSize
  const fixedSize = layout.fixedSize
  const varCount = layout.variableCount

  let varIdx = 0
  for (const f of layout.fields) {
    if (f.isOptional && f.bitmaskBit >= 0) {
      const byteIdx = Math.floor(f.bitmaskBit / 8)
      const bitIdx = f.bitmaskBit % 8
      if (byteIdx >= bitmaskSize || ((view.getUint8(byteIdx) >> bitIdx) & 1) === 0) {
        if (f.category === FieldCategory.Variable) {
          varIdx++
        }
        continue
      }
    }

    if (f.category === FieldCategory.Fixed) {
      const offset = bitmaskSize + f.offset
      result[f.name] = decodeFixedField(f, view, offset)
    } else {
      const tableOffset = bitmaskSize + fixedSize + varIdx * 8
      const start = view.getUint32(tableOffset, true)
      const length = view.getUint32(tableOffset + 4, true)

      if (start !== SENTINEL_ABSENT) {
        if (length > 0) {
          const variableStart = bitmaskSize + fixedSize + varCount * 8
          const fieldBuf = data.slice(variableStart + start, variableStart + start + length)
          result[f.name] = decodeVariableField(f, fieldBuf)
        } else {
          result[f.name] = zeroValueForWire(f)
        }
      }
      varIdx++
    }
  }

  return result
}

// ---- Fixed field encoding ----

function encodeFixedField(f: FieldLayout, val: unknown, view: DataView, offset: number): void {
  switch (f.fieldType) {
    case FieldType.Number: {
      const num = typeof val === 'number' ? val : 0
      view.setFloat64(offset, num, true)
      break
    }
    case FieldType.Boolean: {
      view.setUint8(offset, val ? 1 : 0)
      break
    }
    case FieldType.Enum: {
      const idx = typeof val === 'number' ? val : 0
      view.setUint16(offset, idx, true)
      break
    }
    case FieldType.Date: {
      let ms: number
      if (typeof val === 'string') {
        ms = new Date(val).getTime()
      } else if (val instanceof Date) {
        ms = val.getTime()
      } else if (typeof val === 'number') {
        ms = val
      } else {
        ms = 0
      }
      view.setBigUint64(offset, BigInt(ms), true)
      break
    }
  }
}

function decodeFixedField(f: FieldLayout, view: DataView, offset: number): unknown {
  switch (f.fieldType) {
    case FieldType.Number:
      return view.getFloat64(offset, true)
    case FieldType.Boolean:
      return view.getUint8(offset) !== 0
    case FieldType.Enum:
      return view.getUint16(offset, true)
    case FieldType.Date: {
      const ms = Number(view.getBigUint64(offset, true))
      return new Date(ms)
    }
    default:
      return null
  }
}

// ---- Variable field encoding ----

function encodeVariableField(f: FieldLayout, val: unknown): Uint8Array {
  switch (f.fieldType) {
    case FieldType.String: {
      const str = typeof val === 'string' ? val : String(val ?? '')
      return new TextEncoder().encode(str)
    }
    case FieldType.Array:
    case FieldType.Object: {
      const json = JSON.stringify(val ?? {})
      return new TextEncoder().encode(json)
    }
    default:
      return new TextEncoder().encode(String(val ?? ''))
  }
}

function decodeVariableField(f: FieldLayout, buf: ArrayBuffer): unknown {
  switch (f.fieldType) {
    case FieldType.String:
      return new TextDecoder().decode(buf)
    case FieldType.Array:
    case FieldType.Object: {
      try {
        return JSON.parse(new TextDecoder().decode(buf))
      } catch {
        return new TextDecoder().decode(buf)
      }
    }
    default:
      return new TextDecoder().decode(buf)
  }
}

function zeroValueForWire(f: FieldLayout): unknown {
  switch (f.fieldType) {
    case FieldType.String:
      return ''
    case FieldType.Array:
      return []
    case FieldType.Object:
      return {}
    default:
      return null
  }
}
