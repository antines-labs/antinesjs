import { Direction, MessageType, MAGIC, HEADER_SIZE, type Header } from "./types.js";

/**
 * Encode a Header into a 32-byte buffer.
 */
export function encodeHeader(h: Header): ArrayBuffer {
  const buf = new ArrayBuffer(HEADER_SIZE);
  const dv = new DataView(buf);

  dv.setUint32(0, h.magic, true); // offset 0: magic
  dv.setUint8(4, h.version); // offset 4: version
  dv.setUint8(5, h.direction); // offset 5: direction
  dv.setUint8(6, h.msgType); // offset 6: msgType
  dv.setUint8(7, h.flags); // offset 7: flags
  dv.setUint32(8, h.requestId, true); // offset 8: requestId
  dv.setUint32(12, h.handlerId, true); // offset 12: handlerId
  dv.setUint32(16, h.payloadLen, true); // offset 16: payloadLen
  dv.setUint32(20, h.statusCode, true); // offset 20: statusCode
  // offset 24-31: reserved (zeros)

  return buf;
}

/**
 * Decode a 32-byte buffer into a Header.
 */
export function decodeHeader(buf: ArrayBuffer): Header {
  if (buf.byteLength < HEADER_SIZE) {
    throw new Error(`Header too small: ${buf.byteLength} bytes`);
  }

  const dv = new DataView(buf);

  const magic = dv.getUint32(0, true);
  if (magic !== MAGIC) {
    throw new Error(`Invalid magic: 0x${magic.toString(16)}`);
  }

  return {
    magic,
    version: dv.getUint8(4),
    direction: dv.getUint8(5) as Direction,
    msgType: dv.getUint8(6) as MessageType,
    flags: dv.getUint8(7),
    requestId: dv.getUint32(8, true),
    handlerId: dv.getUint32(12, true),
    payloadLen: dv.getUint32(16, true),
    statusCode: dv.getUint32(20, true),
    reserved: new Uint8Array(buf, 24, 8),
  };
}

/**
 * Read a header from an ArrayBuffer-like source.
 */
export function readHeader(buffer: ArrayBuffer): Header {
  return decodeHeader(buffer);
}

/**
 * Create a new Header with sensible defaults.
 */
export function newHeader(
  direction: Direction,
  msgType: MessageType,
  requestId: number,
  handlerId: number,
  statusCode: number,
  payloadLen: number,
): Header {
  return {
    magic: MAGIC,
    version: 0x01,
    direction,
    msgType,
    flags: 0,
    requestId,
    handlerId,
    payloadLen,
    statusCode,
    reserved: new Uint8Array(8),
  };
}
