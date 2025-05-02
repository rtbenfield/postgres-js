import type { Socket } from "./socket.js";

export class Connection {
  readonly #socket: Socket;

  constructor(socket: Socket) {
    this.#socket = socket;
  }

  async [Symbol.asyncDispose]() {
    // TODO
  }
}
