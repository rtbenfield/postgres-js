import { Connection } from "./connection.js";
import type { SocketFactory } from "./socket.js";

export interface ClientInit {
  readonly connection: ConnectionDetails;
  readonly socket: SocketFactory;
}

export interface ConnectionDetails {
  readonly hostname: string;
  readonly port: number;
}

export class Client {
  readonly #options: ClientInit;

  constructor(options: ClientInit) {
    this.#options = options;
  }

  async connect(): Promise<Connection> {
    const { connection } = this.#options;
    const socket = await this.#options.socket(
      connection.hostname,
      connection.port,
    );
    await socket.connected;
    return new Connection(socket);
  }
}
