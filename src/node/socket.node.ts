/// <reference types="node" />
import { connect } from "node:net";
import { Readable, Writable } from "node:stream";
import type { Socket } from "../socket.js";

/**
 * An adapter for a Node.js `net.Socket` to the `Socket` interface.
 */
export class NodeSocket implements Socket {
  readonly #socket;
  readonly #connected: Promise<void>;
  readonly #readable: ReadableStream<Uint8Array>;
  readonly #writable: WritableStream<Uint8Array>;

  constructor(hostname: string, port: number) {
    this.#socket = connect({
      host: hostname,
      port,
    });

    this.#connected = new Promise((resolve, reject) => {
      this.#socket.once("connect", () => resolve());
      this.#socket.once("error", (e) => reject(e));
    });

    // convert the Node streams to Web streams
    this.#readable = Readable.toWeb(this.#socket);
    this.#writable = Writable.toWeb(this.#socket);
  }

  get connected() {
    return this.#connected;
  }

  get readable() {
    return this.#readable;
  }

  get writable() {
    return this.#writable;
  }
}
