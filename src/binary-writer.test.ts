import { expect, it } from "vitest";
import { BinaryWriter } from "./binary-writer";

it("writes a single byte (number)", () => {
  const writer = new BinaryWriter();
  writer.writeByte(0x2a);
  expect(Array.from(writer.buffer)).toEqual([0x2a]);
  expect(writer.byteLength).toBe(1);
});

it("writes a single byte (string)", () => {
  const writer = new BinaryWriter();
  writer.writeByte("A");
  expect(Array.from(writer.buffer)).toEqual([0x41]);
});

it("throws for invalid string in writeByte", () => {
  const writer = new BinaryWriter();
  expect(() => writer.writeByte("")).toThrowErrorMatchingInlineSnapshot(`[RangeError: Expected string of length 1, got 0]`);
  expect(() => writer.writeByte("AB")).toThrowErrorMatchingInlineSnapshot(`[RangeError: Expected string of length 1, got 2]`);
  expect(() =>
    writer.writeByte({} as any),
  ).toThrowErrorMatchingInlineSnapshot(`[TypeError: Expected number or string, got object]`);
});

it("writes a buffer (Uint8Array)", () => {
  const writer = new BinaryWriter();
  writer.writeBuffer(u8(1, 2, 3));
  expect(Array.from(writer.buffer)).toEqual([1, 2, 3]);
});

it("writes a buffer (ArrayBuffer)", () => {
  const ab = new Uint8Array([4, 5, 6]).buffer;
  const writer = new BinaryWriter();
  writer.writeBuffer(ab);
  expect(Array.from(writer.buffer)).toEqual([4, 5, 6]);
});

it("writes a 16-bit integer (big-endian)", () => {
  const writer = new BinaryWriter();
  writer.writeInt16(0x1234);
  expect(Array.from(writer.buffer)).toEqual([0x12, 0x34]);
});

it("writes a 32-bit integer (big-endian)", () => {
  const writer = new BinaryWriter();
  writer.writeInt32(0x01020304);
  expect(Array.from(writer.buffer)).toEqual([1, 2, 3, 4]);
});

it("writes a 64-bit integer (big-endian)", () => {
  const writer = new BinaryWriter();
  writer.writeInt64(0x0102030405060708n);
  expect(Array.from(writer.buffer)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
});

it("writes a float64 (big-endian)", () => {
  const writer = new BinaryWriter();
  writer.writeFloat64(Math.PI);
  const view = new DataView(writer.buffer.buffer);
  expect(view.getFloat64(0, false)).toBeCloseTo(Math.PI, 12);
});

it("writes an OID (alias for writeInt32)", () => {
  const writer = new BinaryWriter();
  writer.writeOid(42);
  expect(Array.from(writer.buffer)).toEqual([0, 0, 0, 42]);
});

it("writes a string without null-terminator using encodeInto", () => {
  const writer = new BinaryWriter();
  writer.encodeInto("abc");
  expect(Array.from(writer.buffer)).toEqual([0x61, 0x62, 0x63]);
});

it("writes a null-terminated string with writeString", () => {
  const writer = new BinaryWriter();
  writer.writeString("hello");
  expect(Array.from(writer.buffer)).toEqual([
    0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x00,
  ]);
});

it("prepends bytes with unshift", () => {
  const writer = new BinaryWriter();
  writer.writeBuffer(u8(3, 4, 5));
  writer.unshift(u8(1, 2));
  expect(Array.from(writer.buffer)).toEqual([1, 2, 3, 4, 5]);
});

it("supports chaining of write methods", () => {
  const writer = new BinaryWriter();
  writer.writeByte(1).writeInt16(0x0203).writeInt32(0x04050607);
  expect(Array.from(writer.buffer)).toEqual([1, 2, 3, 4, 5, 6, 7]);
});

it("byteLength matches buffer length", () => {
  const writer = new BinaryWriter();
  writer.writeBuffer(u8(1, 2, 3, 4));
  expect(writer.byteLength).toBe(writer.buffer.length);
});

it("handles writing empty string and zero-length buffer", () => {
  const writer = new BinaryWriter();
  writer.writeString("");
  expect(Array.from(writer.buffer)).toEqual([0]);
  writer.writeBuffer(u8());
  expect(Array.from(writer.buffer)).toEqual([0]);
});

function u8(...bytes: number[]) {
  return new Uint8Array(bytes);
}
