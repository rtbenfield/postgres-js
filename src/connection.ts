import { executeSequence, type Sequence } from "./protocol/sequence.js";
import type { Socket } from "./socket.js";
import { PostgresAlignmentStream } from "./streams.js";

export class Connection implements AsyncDisposable {
  readonly #readable: ReadableStream<Uint8Array>;
  readonly #writable: WritableStream<Uint8Array>;

  constructor(socket: Socket) {
    // ? TODO: is this the best place to add the alignmen stream?
    this.#readable = socket.readable.pipeThrough(new PostgresAlignmentStream());
    this.#writable = socket.writable;
  }

  async [Symbol.asyncDispose](): Promise<void> {
    // TODO
  }

  async send<T>(command: Sequence<T>): Promise<T> {
    return executeSequence(
      { readable: this.#readable, writable: this.#writable },
      command,
    );
  }
}
