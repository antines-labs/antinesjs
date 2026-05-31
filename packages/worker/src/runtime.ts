import { Socket, connect } from 'node:net'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import {
  Direction,
  MessageType,
  HEADER_SIZE,
  MAGIC,
  decodeHeader,
  encodeHeader,
  newHeader,
  calculateLayout,
  deserializeInput,
  serializeOutput,
} from '@antinesjs/protocol'
import type { Header, CompiledLayout } from '@antinesjs/protocol'
import type { ObjectIR } from '@antinesjs/schema'

interface RouteManifest {
  method: string
  path: string
  handlerId: number
  handlerFile: string
  hasHandler: boolean
  params: string[]
  schema: {
    input?: ObjectIR
    output?: ObjectIR
  }
}

interface Manifest {
  version: number
  routes: RouteManifest[]
}

interface HandlerEntry {
  handlerId: number
  handler: (ctx: Record<string, unknown>) => Promise<Record<string, unknown>>
  inputLayout: CompiledLayout | null
  outputLayout: CompiledLayout | null
}

export class WorkerRuntime {
  private socket: Socket | null = null
  private handlers = new Map<number, HandlerEntry>()
  private buf = new Uint8Array(0)

  async start(socketPath: string, manifestPath: string): Promise<void> {
    const manifestRaw = readFileSync(manifestPath, 'utf-8')
    const manifest: Manifest = JSON.parse(manifestRaw)

    if (manifest.version !== 1) {
      throw new Error(`Unsupported manifest version: ${manifest.version}`)
    }

    for (const route of manifest.routes) {
      if (!route.hasHandler) continue

      const handlerFile = resolve(dirname(manifestPath), route.handlerFile)
      const mod = await import(handlerFile)
      const defaultExport = mod.default as { handler?: (ctx: Record<string, unknown>) => Promise<Record<string, unknown>> } | undefined

      if (!defaultExport?.handler) {
        throw new Error(`Route ${route.handlerFile} has no handler export`)
      }

      const entry: HandlerEntry = {
        handlerId: route.handlerId,
        handler: defaultExport.handler,
        inputLayout: route.schema.input ? calculateLayout(route.schema.input) : null,
        outputLayout: route.schema.output ? calculateLayout(route.schema.output) : null,
      }

      this.handlers.set(route.handlerId, entry)
    }

    await this.connect(socketPath)
  }

  private connect(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const sock = connect(path, () => resolve())
      sock.on('error', reject)
      sock.setNoDelay(true)
      sock.on('data', (data: Uint8Array) => this.onData(data))
      this.socket = sock
    })
  }

  private onData(data: Uint8Array): void {
    const newBuf = new Uint8Array(this.buf.length + data.length)
    newBuf.set(this.buf)
    newBuf.set(data, this.buf.length)
    this.buf = newBuf
    this.processBuffer()
  }

  private processBuffer(): void {
    while (this.buf.length >= HEADER_SIZE) {
      const headerSlice = this.buf.subarray(0, HEADER_SIZE)
      let header: Header
      try {
        header = decodeHeader(headerSlice.buffer)
      } catch {
        return
      }

      if (header.magic !== MAGIC) {
        this.buf = this.buf.subarray(1)
        continue
      }

      const totalMsgSize = HEADER_SIZE + header.payloadLen
      if (this.buf.length < totalMsgSize) {
        return
      }

      const payload = this.buf.subarray(HEADER_SIZE, totalMsgSize).slice(0)
      this.buf = this.buf.subarray(totalMsgSize)

      this.processMessage(header, payload)
    }
  }

  private async processMessage(header: Header, payload: Uint8Array): Promise<void> {
    try {
      if (header.msgType === MessageType.Ping) {
        this.sendPong(header)
      } else if (header.msgType === MessageType.Dispatch) {
        await this.handleDispatch(header, payload)
      }
    } catch (err) {
      console.error('Worker error:', err)
    }
  }

  private sendPong(header: Header): void {
    const resp = encodeHeader(newHeader(Direction.JSToGo, MessageType.Result, header.requestId, header.handlerId, 200, 0))
    this.socket?.write(new Uint8Array(resp))
  }

  private async handleDispatch(header: Header, payload: Uint8Array): Promise<void> {
    const entry = this.handlers.get(header.handlerId)
    if (!entry) {
      const err = encodeHeader(newHeader(Direction.JSToGo, MessageType.Error, header.requestId, header.handlerId, 404, 0))
      this.socket?.write(new Uint8Array(err))
      return
    }

    let input: Record<string, unknown> = {}
    if (payload.length > 0 && entry.inputLayout) {
      input = deserializeInput(entry.inputLayout, payload.buffer as ArrayBuffer)
    }

    try {
      const output = await entry.handler(input)

      const outputBuf = entry.outputLayout ? serializeOutput(entry.outputLayout, output) : new ArrayBuffer(0)
      const resp = encodeHeader(newHeader(Direction.JSToGo, MessageType.Result, header.requestId, header.handlerId, 200, outputBuf.byteLength))
      this.socket?.write(new Uint8Array(resp))
      if (outputBuf.byteLength > 0) {
        this.socket?.write(new Uint8Array(outputBuf))
      }
    } catch {
      const err = encodeHeader(newHeader(Direction.JSToGo, MessageType.Error, header.requestId, header.handlerId, 500, 0))
      this.socket?.write(new Uint8Array(err))
    }
  }

  stop(): void {
    this.socket?.end()
    this.socket?.destroy()
    this.socket = null
  }
}
