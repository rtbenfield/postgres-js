import { expect, it } from "vitest";
import { BinaryReader } from "./binary-reader";

it("reads a single byte and advances position", () => {
  const reader = new BinaryReader(u8(0x12, 0x34));
  expect(reader.readByte()).toBe(0x12);
  expect(reader.readByte()).toBe(0x34);
  expect(reader.remaining).toBe(0);
});

it("peeks at the next byte without advancing", () => {
  const reader = new BinaryReader(u8(0x56, 0x78));
  expect(reader.peekByte()).toBe(0x56);
  expect(reader.peekByte()).toBe(0x56);
  expect(reader.readByte()).toBe(0x56);
  expect(reader.peekByte()).toBe(0x78);
});

it("reads a buffer of specified length", () => {
  const reader = new BinaryReader(u8(1, 2, 3, 4, 5));
  expect(Array.from(reader.readBuffer(3))).toEqual([1, 2, 3]);
  expect(Array.from(reader.readBuffer(2))).toEqual([4, 5]);
  expect(reader.remaining).toBe(0);
});

it("reads a double-precision float (big-endian)", () => {
  const buf = new ArrayBuffer(8);
  new DataView(buf).setFloat64(0, Math.PI, false);
  const reader = new BinaryReader(new Uint8Array(buf));
  expect(reader.readFloat64()).toBeCloseTo(Math.PI, 12);
});

it("reads a 16-bit integer (big-endian)", () => {
  const reader = new BinaryReader(u8(0x12, 0x34));
  expect(reader.readInt16()).toBe(0x1234);
  expect(reader.remaining).toBe(0);
});

it("reads a 32-bit integer (big-endian)", () => {
  const reader = new BinaryReader(u8(0x01, 0x23, 0x45, 0x67));
  expect(reader.readInt32()).toBe(0x01234567);
});

it("reads a 64-bit integer (big-endian)", () => {
  const big = 0x0102030405060708n;
  const buf = new ArrayBuffer(8);
  new DataView(buf).setBigUint64(0, big, false);
  const reader = new BinaryReader(new Uint8Array(buf));
  expect(reader.readInt64()).toBe(big);
});

it("readOid calls readInt32", () => {
  const reader = new BinaryReader(u8(0x00, 0x00, 0x00, 0x2a));
  expect(reader.readOid()).toBe(42);
});

it("reads a fixed-length string", () => {
  const reader = new BinaryReader(u8(0x61, 0x62, 0x63, 0x64));
  expect(reader.readFixedLengthString(4)).toBe("abcd");
});

it("reads a null-terminated string", () => {
  const reader = new BinaryReader(
    u8(0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x00, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x00),
  );
  expect(reader.readString()).toBe("hello");
  expect(reader.readString()).toBe("world");
});

it("handles empty null-terminated strings", () => {
  const reader = new BinaryReader(u8(0x00, 0x61, 0x00));
  expect(reader.readString()).toBe("");
  expect(reader.readString()).toBe("a");
});

it("rest returns the remaining buffer", () => {
  const reader = new BinaryReader(u8(1, 2, 3, 4));
  reader.readByte();
  expect(Array.from(reader.rest)).toEqual([2, 3, 4]);
  reader.readBuffer(2);
  expect(Array.from(reader.rest)).toEqual([4]);
});

it("remaining returns the correct number of bytes left", () => {
  const reader = new BinaryReader(u8(1, 2, 3));
  expect(reader.remaining).toBe(3);
  reader.readByte();
  expect(reader.remaining).toBe(2);
  reader.readBuffer(2);
  expect(reader.remaining).toBe(0);
});

it("throws or returns undefined when reading past end", () => {
  const reader = new BinaryReader(u8(1));
  reader.readByte();
  expect(() => reader.readByte()).toThrowErrorMatchingInlineSnapshot(
    `[RangeError: Offset is outside the bounds of the DataView]`,
  );
  expect(() => reader.readInt16()).toThrowErrorMatchingInlineSnapshot(
    `[RangeError: Offset is outside the bounds of the DataView]`,
  );
  expect(() => reader.readInt32()).toThrowErrorMatchingInlineSnapshot(
    `[RangeError: Offset is outside the bounds of the DataView]`,
  );
  expect(() => reader.readInt64()).toThrowErrorMatchingInlineSnapshot(
    `[RangeError: Offset is outside the bounds of the DataView]`,
  );
  expect(() => reader.readFloat64()).toThrowErrorMatchingInlineSnapshot(
    `[RangeError: Offset is outside the bounds of the DataView]`,
  );
});

function u8(...bytes: number[]) {
  return new Uint8Array(bytes);
}
