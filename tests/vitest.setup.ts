import { expect } from "vitest";

expect.addEqualityTesters([
  // Uint8Array comparison
  (a, b) => {
    if (a instanceof Uint8Array && b instanceof Uint8Array) {
      if (a.byteLength !== b.byteLength) return false;
      for (let i = 0; i < a.byteLength; ++i) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    }

    return undefined;
  },

  // ArrayBuffer comparison
  (a, b) => {
    if (a instanceof ArrayBuffer && b instanceof ArrayBuffer) {
      if (a.byteLength !== b.byteLength) return false;
      const ua = new Uint8Array(a);
      const ub = new Uint8Array(b);
      for (let i = 0; i < ua.byteLength; ++i) {
        if (ua[i] !== ub[i]) return false;
      }
      return true;
    }

    return undefined;
  },
]);
