# @antines/worker

JavaScript worker runtime for Antines. Connects to the Go runtime over a Unix socket, loads the manifest, imports route handler files, pre-computes wire layouts, and dispatches incoming requests to the appropriate handler.

## Usage

```ts
import { WorkerRuntime } from "@antines/worker";

const worker = new WorkerRuntime();
await worker.start(socketPath, manifestPath);
```

## How it works

1. Loads `antines-manifest.json` — reads the route list with schemas and handler file paths
2. Dynamically imports each handler file referenced in the manifest
3. Pre-computes `CompiledLayout` for every route's input/output schema
4. Connects to the Go runtime over a Unix domain socket
5. Reads framed messages (32-byte header + payload):
   - **Dispatch** — deserializes input data, calls the handler, serializes the result, sends it back
   - **Ping** — responds immediately with a Result message
6. On error, sends an Error response with the appropriate status code

## API

| Export | Description |
|---|---|
| `WorkerRuntime` | Main class. Call `start()` to begin listening, `stop()` to shut down. |

## License

MIT
