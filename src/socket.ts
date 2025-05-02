/**
 * Abstract type representing a socket connection to a database server.
 * Implementations are runtime specific as there is no standard socket API.
 */
export interface Socket {
  /**
   * Promise that resolves when the socket connects or rejects if the socket
   * fails to connect.
   */
  readonly connected: Promise<void>;
  /** The readable side of the socket connection. */
  readonly readable: ReadableStream<Uint8Array>;
  /** The writable side of the socket connection. */
  readonly writable: WritableStream<Uint8Array>;
}

/**
 * Factory function for creating a new Socket instance in a particular runtime.
 */
export type SocketFactory = (hostname: string, port: number) => Promise<Socket>;
