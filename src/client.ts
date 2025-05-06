import { Connection } from "./connection.js";
import { startupSequence } from "./protocol/startup.sequence.js";
import type { SocketFactory } from "./socket.js";

export interface ClientInit {
  readonly connection: ConnectionDetails;
  readonly socket: SocketFactory;
}

export interface ConnectionDetails {
  readonly database: string;
  readonly hostname: string;
  readonly password?: string;
  readonly port: number;
  /** @default false */
  readonly replication?: boolean | "database";
  readonly username: string;
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

    const conn = new Connection(socket);
    await conn.send(startupSequence({ connection }));
    return conn;
  }
}
