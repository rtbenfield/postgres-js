import { executeSequence, type Sequence } from "./protocol/sequence.js";

interface DuplexStream {
  readonly readable: ReadableStream<Uint8Array>;
  readonly writable: WritableStream<Uint8Array>;
}

export class Connection implements AsyncDisposable {
  readonly #stream: DuplexStream;

  constructor(stream: DuplexStream) {
    this.#stream = stream;
  }

  async [Symbol.asyncDispose](): Promise<void> {
    // TODO
  }

  async send<T>(command: Sequence<T>): Promise<T> {
    return executeSequence(this.#stream, command);
  }
}
