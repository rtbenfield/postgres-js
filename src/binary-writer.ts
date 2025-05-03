// a globally scoped encoder is fine
const encoder = new TextEncoder();

/**
 * A utility for incrementally writing binary data into a Uint8Array buffer.
 *
 * The underlying buffer is resizable to enable efficient incremental writing
 * without copying the entire buffer on each write or overprovisioning the
 * buffer.
 */
export class BinaryWriter {
  #buffer: ArrayBuffer;

  /**
   * Constructs a new BinaryWriter instance with an empty buffer.
   * @param initialByteLength The initial size of the buffer, if known. This reduces
   * the frequency of buffer resizing.
   * @param maxByteLength The maximum size of the buffer. This prevents the buffer
   * from growing beyond this limit.
   */
  constructor(initialByteLength?: number, maxByteLength = 1024) {
    // TODO: use initialByteLength, which needs work in #extend
    // create a resizable ArrayBuffer to extend as bytes are written
    this.#buffer = new ArrayBuffer(0, { maxByteLength });
  }

  /** Returns the current buffer values as a Uint8Array. */
  get buffer() {
    return new Uint8Array(this.#buffer);
  }

  /** Returns the current size of the buffer. */
  get byteLength() {
    return this.#buffer.byteLength;
  }

  /**
   * Encodes the specified string into the buffer without a null-terminator.
   */
  encodeInto(value: string) {
    const position = this.#buffer.byteLength;
    this.#extend(value.length);
    const destination = new Uint8Array(this.#buffer, position, value.length);
    encoder.encodeInto(value, destination);
    return this;
  }

  /**
   * Prepends the specified bytes to the beginning of the buffer.
   */
  unshift(value: Uint8Array) {
    // grab a handle to the original buffer before resize
    // the end position is important for this since the buffer will mutate
    const original = new Uint8Array(this.#buffer).subarray(
      0,
      this.#buffer.byteLength,
    );

    // resize the buffer
    this.#extend(value.byteLength);

    // shift the existing bytes to the right
    const buffer = new Uint8Array(this.#buffer);
    buffer.set(original, value.byteLength);

    // copy the new value into the new buffer at the start
    buffer.set(value, 0);

    return this;
  }

  writeBuffer(value: ArrayBufferLike): this;
  writeBuffer(value: Uint8Array): this;
  writeBuffer(value: ArrayBufferLike | Uint8Array) {
    const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
    const position = this.#buffer.byteLength;
    this.#extend(bytes.byteLength);
    const buffer = new Uint8Array(this.#buffer);
    buffer.set(bytes, position);
    return this;
  }

  writeByte(value: number): this;
  writeByte(value: string): this;
  writeByte(value: number | string) {
    if (typeof value === "string") {
      if (value.length !== 1) {
        throw new RangeError(
          `Expected string of length 1, got ${value.length}`,
        );
      }
      return this.encodeInto(value);
    } else if (typeof value === "number") {
      return this.writeInt8(value);
    } else {
      throw new TypeError(`Expected number or string, got ${typeof value}`);
    }
  }

  writeFloat64(value: number) {
    const position = this.#buffer.byteLength;

    // resize the buffer
    this.#extend(8);

    // write the value
    const view = new DataView(this.#buffer);
    view.setFloat64(position, value, false);

    return this;
  }

  writeInt8(value: number) {
    const position = this.#buffer.byteLength;

    // resize the buffer
    this.#extend(1);

    // write the value
    const view = new DataView(this.#buffer);
    view.setUint8(position, value);

    return this;
  }

  writeInt16(value: number) {
    const position = this.#buffer.byteLength;

    // resize the buffer
    this.#extend(2);

    // write the value
    const view = new DataView(this.#buffer);
    view.setUint16(position, value, false);

    return this;
  }

  writeInt32(value: number) {
    const position = this.#buffer.byteLength;

    // resize the buffer
    this.#extend(4);

    // write the value
    const view = new DataView(this.#buffer);
    view.setUint32(position, value, false);

    return this;
  }

  writeInt64(value: bigint) {
    const position = this.#buffer.byteLength;

    // resize the buffer
    this.#extend(8);

    // write the value
    const view = new DataView(this.#buffer);
    view.setBigUint64(position, value, false);

    return this;
  }

  writeOid(value: number) {
    return this.writeInt32(value);
  }

  /**
   * Writes the specified string into the buffer along with a null-terminator.
   */
  writeString(value: string) {
    // encode the string into the buffer
    // then terminate with a null byte
    return this.encodeInto(value).writeInt8(0);
  }

  /** Extends the underlying ArrayBuffer by the specified length. */
  #extend(length: number) {
    this.#buffer.resize(this.#buffer.byteLength + length);
    return this;
  }
}
