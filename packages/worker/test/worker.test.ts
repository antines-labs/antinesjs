import { test, expect, beforeAll } from 'bun:test'
import { createServer, Socket } from 'node:net'
import { mkdtempSync, writeFileSync, mkdirSync, realpathSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  Direction,
  MessageType,
  HEADER_SIZE,
  newHeader,
  encodeHeader,
  calculateLayout,
  serializeOutput,
  deserializeInput,
} from '@antinesjs/protocol'
import type { ObjectIR } from '@antinesjs/schema'
import { WorkerRuntime } from '../src/runtime.js'

const inputSchema: ObjectIR = {
  type: 'object',
  fieldOrder: ['name'],
  fields: {
    name: { schema: { type: 'string' } as any, optional: false, nullable: false },
  },
  strict: false,
}

const outputSchema: ObjectIR = {
  type: 'object',
  fieldOrder: ['message'],
  fields: {
    message: { schema: { type: 'string' } as any, optional: false, nullable: false },
  },
  strict: false,
}

const inputLayout = calculateLayout(inputSchema)
const outputLayout = calculateLayout(outputSchema)

let tmpDir: string
let manifestPath: string

beforeAll(() => {
  tmpDir = realpathSync(mkdtempSync(join(tmpdir(), 'worker-test-')))
  manifestPath = join(tmpDir, 'antines-manifest.json')

  mkdirSync(join(tmpDir, 'routes'), { recursive: true })
  writeFileSync(join(tmpDir, 'routes/hello.get.ts'), `
export default {
  handler: async (ctx: Record<string, unknown>) => {
    return { message: 'Hello, ' + ((ctx as any).name || 'World') }
  },
}
`)

  writeFileSync(manifestPath, JSON.stringify({
    version: 1,
    routes: [
      {
        method: 'GET',
        path: '/hello',
        handlerId: 1,
        handlerFile: 'routes/hello.get.ts',
        hasHandler: true,
        params: [],
        schema: { input: inputSchema, output: outputSchema },
      },
    ],
  }))
})

test('full dispatch round-trip via Unix socket', async () => {
  const socketPath = join(tmpDir, 'roundtrip.sock')
  const server = createServer()

  const result = await new Promise<Record<string, unknown>>(async (resolve, reject) => {
    server.on('connection', (goSocket: Socket) => {
      const inputData = { name: 'Alice' }
      const payload = serializeOutput(inputLayout, inputData)
      const header = encodeHeader(newHeader(Direction.GoToJS, MessageType.Dispatch, 42, 1, 0, payload.byteLength))
      goSocket.write(new Uint8Array(header))
      goSocket.write(new Uint8Array(payload))

      readMessage(goSocket, outputLayout).then(resolve).catch(reject)
    })
    server.on('error', reject)

    await new Promise<void>((resolve) => server.listen(socketPath, resolve))

    const worker = new WorkerRuntime()
    worker.start(socketPath, manifestPath).catch(reject)
  })

  expect(result.message).toBe('Hello, Alice')
  server.close()
})

test('unknown handlerId returns error', async () => {
  const socketPath = join(tmpDir, 'unknown.sock')
  const server = createServer()

  const result = await new Promise<{ msgType: number; statusCode: number }>(async (resolve, reject) => {
    server.on('connection', (goSocket: Socket) => {
      const header = encodeHeader(newHeader(Direction.GoToJS, MessageType.Dispatch, 99, 999, 0, 0))
      goSocket.write(new Uint8Array(header))

      readRawResponse(goSocket).then(resolve).catch(reject)
    })
    server.on('error', reject)

    await new Promise<void>((resolve) => server.listen(socketPath, resolve))

    const worker = new WorkerRuntime()
    worker.start(socketPath, manifestPath).catch(reject)
  })

  expect(result.msgType).toBe(MessageType.Error)
  expect(result.statusCode).toBe(404)
  server.close()
})

test('ping is answered with result', async () => {
  const socketPath = join(tmpDir, 'ping.sock')
  const server = createServer()

  const result = await new Promise<{ msgType: number; statusCode: number }>(async (resolve, reject) => {
    server.on('connection', (goSocket: Socket) => {
      const header = encodeHeader(newHeader(Direction.GoToJS, MessageType.Ping, 0, 0, 0, 0))
      goSocket.write(new Uint8Array(header))

      readRawResponse(goSocket).then(resolve).catch(reject)
    })
    server.on('error', reject)

    await new Promise<void>((resolve) => server.listen(socketPath, resolve))

    const worker = new WorkerRuntime()
    worker.start(socketPath, manifestPath).catch(reject)
  })

  expect(result.msgType).toBe(MessageType.Result)
  server.close()
})

// ---- Helpers ----

function readMessage(socket: Socket, layout: any): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let buf = Buffer.alloc(0)
    const onData = (data: Buffer) => {
      buf = Buffer.concat([buf, data])
      while (buf.length >= HEADER_SIZE) {
        const dv = new DataView(new Uint8Array(buf.subarray(0, HEADER_SIZE)).buffer)
        const magic = dv.getUint32(0, true)
        if (magic !== 0x414E5453) { buf = buf.subarray(1); continue }
        const payloadLen = dv.getUint32(16, true)
        const totalSize = HEADER_SIZE + payloadLen
        if (buf.length < totalSize) return
        const payload = buf.subarray(HEADER_SIZE, totalSize)
        buf = buf.subarray(totalSize)
        socket.removeListener('data', onData)
        const result = deserializeInput(layout, new Uint8Array(payload).buffer as ArrayBuffer)
        resolve(result)
        return
      }
    }
    socket.on('data', onData)
    socket.on('error', reject)
  })
}

function readRawResponse(socket: Socket): Promise<{ msgType: number; statusCode: number }> {
  return new Promise((resolve, reject) => {
    let buf = Buffer.alloc(0)
    const onData = (data: Buffer) => {
      buf = Buffer.concat([buf, data])
      while (buf.length >= HEADER_SIZE) {
        const dv = new DataView(new Uint8Array(buf.subarray(0, HEADER_SIZE)).buffer)
        const magic = dv.getUint32(0, true)
        if (magic !== 0x414E5453) { buf = buf.subarray(1); continue }
        const msgType = dv.getUint8(6)
        const statusCode = dv.getUint32(20, true)
        buf = buf.subarray(HEADER_SIZE)
        socket.removeListener('data', onData)
        resolve({ msgType, statusCode })
        return
      }
    }
    socket.on('data', onData)
    socket.on('error', reject)
  })
}
