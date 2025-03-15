# The Universal Postgres Client

> [!WARNING]  
> This is an experimental project exploring and is **not yet intended for production use**. It's buggy, lacks important features, and may have breaking changes in any release.

This package aims to provide a [Postgres](https://www.postgresql.org/) client that is compatible with every JavaScript runtime, no polyfills required.  It starts from scratch, building on Web APIs and modern JavaScript features to provide an excellent developer experience while supporting advanced use cases.

Some things that make the this Postgres client different:

- Streaming-first API, with the option to eagerly load into memory.
- Built on [`TypedArray`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray) instead of [`Buffer`](https://nodejs.org/api/buffer.html), so no reliance on Node polyfills.
- Uses [Web Streams](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API) instead of callbacks to reduce memory use while streaming data.
- Support for binary encoding of data types for better complex data type support, network efficiency, and lower memory usage.
- Tree-shakeable and ESM compatible.
- TypeScript support out-of-the-box.

