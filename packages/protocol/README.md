# @antines/protocol

Positional binary IPC protocol for Antines. Defines the wire format used between Go and JavaScript workers over Unix sockets — fixed-size 32-byte header + payload, with a compact field layout that uses a bitmask + offset table to avoid encoding field names.

## Usage

```ts
import {
  Direction, MessageType,
  HEADER_SIZE, newHeader, encodeHeader, decodeHeader,
  calculateLayout, serializeOutput, deserializeInput,
} from "@antines/protocol";
import type { ObjectIR } from "@antines/schema";

const schema: ObjectIR = { /* ... */ };
const layout = calculateLayout(schema);

// Encode
const header = encodeHeader(
  newHeader(Direction.GoToJS, MessageType.Dispatch, 42, 1, 0, payload.byteLength),
);
const payload = serializeOutput(layout, data);

// Decode
const result = deserializeInput(layout, buffer);
```

## Wire format

| Section | Size |
|---|---|
| Bitmask (optional field presence) | 1–4 bytes |
| Fixed fields (numbers, booleans, enums, dates) | Fixed per schema |
| Offset table (variable field positions) | 8 bytes × varCount |
| Variable data (strings, arrays, objects) | Variable |

The 32-byte header contains magic (`0x414e5453` = "ANTS"), version, direction, message type, request ID, handler ID, payload length, and status code — all little-endian.

## API

| Export | Description |
|---|---|
| `newHeader(dir, msgType, requestId, handlerId, statusCode, payloadLen)` | Creates a Header with defaults |
| `encodeHeader(h)` | Header → 32-byte ArrayBuffer |
| `decodeHeader(buf)` | 32-byte buffer → Header (validates magic) |
| `calculateLayout(objectIR)` | Computes wire layout from a serialized ObjectIR |
| `serializeOutput(layout, data)` | Encodes JS data to positional wire format |
| `deserializeInput(layout, buffer)` | Decodes wire format to JS data |
| `Direction`, `MessageType` | Enums: `GoToJS/JSToGo`, `Dispatch/Result/Ping/Error` |
| `HEADER_SIZE` | 32 bytes |

## License

MIT
