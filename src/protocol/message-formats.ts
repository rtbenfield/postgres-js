import { BinaryReader } from "../binary-reader.js";
import { BinaryWriter } from "../binary-writer.js";

const decoder = new TextDecoder();

/**
 * AuthenticationOK (B)
 *
 * @see {@link https://www.postgresql.org/docs/current/protocol-message-formats.html#PROTOCOL-MESSAGE-FORMATS-AUTHENTICATIONOK PostgreSQL Docs}
 */
export class AuthenticationOK {
  /** 'R' */
  static readonly CODE = 0x52;

  static parse(buffer: Uint8Array) {
    const reader = new BinaryReader(buffer);
    const code = reader.readByte();
    // console.assert(
    //   code === AuthenticationOK.CODE,
    //   `Expected 'R', got ${String.fromCharCode(code)}`,
    // );
    const length = reader.readInt32();
    // console.assert(length === 8, `Expected length 8, got ${length}`);
    const tag = reader.readInt32();
    // console.assert(tag === 0, `Expected 0, got ${tag}`);
    return new AuthenticationOK();
  }
}

/**
 * AuthenticationSASL (B)
 *
 * @see {@link https://www.postgresql.org/docs/current/protocol-message-formats.html#PROTOCOL-MESSAGE-FORMATS-AUTHENTICATIONSASL PostgreSQL Docs}
 */
export class AuthenticationSASL {
  mechanisms: Set<string>;

  constructor(mechanisms: Set<string>) {
    this.mechanisms = mechanisms;
  }

  static parse(buffer: Uint8Array) {
    const reader = new BinaryReader(buffer);
    const code = reader.readByte();
    // console.assert(
    //   code === 0x52,
    //   `Expected 'R', got ${String.fromCharCode(code)}`,
    // );
    const length = reader.readInt32();
    const tag = reader.readInt32();
    // console.assert(tag === 10, `Expected 10, got ${tag}`);

    const mechanisms = new Set<string>();
    while (reader.remaining > 1) {
      mechanisms.add(reader.readString());
    }
    // console.assert(reader.readByte() === 0x0, "Expected 0x0");
    return new AuthenticationSASL(mechanisms);
  }
}

/**
 * AuthenticationSASLContinue (B)
 *
 * @see {@link https://www.postgresql.org/docs/17/protocol-message-formats.html#PROTOCOL-MESSAGE-FORMATS-AUTHENTICATIONSASLCONTINUE PostgreSQL Docs}
 */
export class AuthenticationSASLContinue {
  payload: string;

  constructor(payload: string) {
    this.payload = payload;
  }

  static parse(buffer: Uint8Array) {
    const reader = new BinaryReader(buffer);
    const code = reader.readByte();
    // console.assert(
    //   code === 0x52,
    //   `Expected 'R', got ${String.fromCharCode(code)}`,
    // );
    const length = reader.readInt32();
    const tag = reader.readInt32();
    // console.assert(tag === 11, `Expected 11, got ${tag}`);
    // console.assert(
    //   reader.remaining === length - 8,
    //   `Invalid length of remaining data. Expected ${length - 8}, got ${
    //     reader.remaining
    //   }`,
    // );
    const data = decoder.decode(reader.rest);
    return new AuthenticationSASLContinue(data);
  }
}

/**
 * AuthenticationSASLFinal (B)
 *
 * @see {@link https://www.postgresql.org/docs/current/protocol-message-formats.html#PROTOCOL-MESSAGE-FORMATS-AUTHENTICATIONSASLFINAL PostgreSQL Docs}
 */
export class AuthenticationSASLFinal {
  payload: string;

  constructor(payload: string) {
    this.payload = payload;
  }

  static parse(buffer: Uint8Array) {
    const reader = new BinaryReader(buffer);
    const code = reader.readByte();
    // console.assert(
    //   code === 0x52,
    //   `Expected 'R', got ${String.fromCharCode(code)}`,
    // );
    const length = reader.readInt32();
    const tag = reader.readInt32();
    // console.assert(tag === 12, `Expected 12, got ${tag}`);
    // console.assert(
    //   reader.remaining === length - 8,
    //   `Invalid length of remaining data. Expected ${length - 8}, got ${
    //     reader.remaining
    //   }`,
    // );
    const data = decoder.decode(reader.rest);
    return new AuthenticationSASLFinal(data);
  }
}

/**
 * BackendKeyData (B)
 *
 * @see {@link https://www.postgresql.org/docs/current/protocol-message-formats.html#PROTOCOL-MESSAGE-FORMATS-BACKENDKEYDATA PostgreSQL Docs}
 */
export class BackendKeyData {
  /** 'K' */
  static readonly CODE = 0x4b;

  pid: number;
  secretKey: number;

  constructor(pid: number, secretKey: number) {
    this.pid = pid;
    this.secretKey = secretKey;
  }

  static parse(buffer: Uint8Array) {
    const reader = new BinaryReader(buffer);
    const code = reader.readByte();
    // console.assert(
    //   code === BackendKeyData.CODE,
    //   `Expected 'B', got ${String.fromCharCode(code)}`,
    // );
    const length = reader.readInt32();
    // console.assert(length === 12, `Expected length 12, got ${length}`);
    const pid = reader.readInt32();
    const secretKey = reader.readInt32();
    return new BackendKeyData(pid, secretKey);
  }
}

/**
 * Bind (F)
 *
 * @see {@link https://www.postgresql.org/docs/current/protocol-message-formats.html#PROTOCOL-MESSAGE-FORMATS-BIND PostgreSQL Docs}
 */
export class Bind {
  /** 'B' */
  static readonly CODE = 0x42;

  /** The name of the destination portal (an empty string selects the unnamed portal). */
  destinationName: string;
  /** The name of the source prepared statement (an empty string selects the unnamed prepared statement). */
  sourceName: string;
  /** The parameter values. */
  parameterValues: ReadonlyArray<null | string | Uint8Array>;
  /**
   * The result-column format codes. Each must presently be zero (text) or one (binary).
   *
   * This can be zero to indicate that there are no result columns or that the result columns should all use the
   * default format (text); or one, in which case the specified format code is applied to all result columns (if any);
   * or it can equal the actual number of result columns of the query.
   */
  resultFormatCodes: ReadonlyArray<0 | 1>;

  constructor(
    destinationName: string,
    sourceName: string,
    parameterValues: ReadonlyArray<null | string | Uint8Array>,
    resultFormatCodes: ReadonlyArray<0 | 1>,
  ) {
    this.destinationName = destinationName;
    this.sourceName = sourceName;
    this.parameterValues = parameterValues;
    this.resultFormatCodes = resultFormatCodes;
  }

  get buffer() {
    const writer = new BinaryWriter();
    writer.writeString(this.destinationName);
    writer.writeString(this.sourceName);

    // parameter format codes
    // TODO: there are some optimizations that can be done here if all parameters are the same type
    writer.writeInt16(this.parameterValues.length);
    for (const value of this.parameterValues) {
      if (value === null) {
        // NULL could be either 0 or 1
        writer.writeInt16(0);
      } else if (typeof value === "string") {
        writer.writeInt16(0);
      } else if (value instanceof Uint8Array) {
        writer.writeInt16(1);
      } else {
        throw new TypeError(
          "Expected string or Uint8Array for parameter value",
        );
      }
    }

    // parameter values
    writer.writeInt16(this.parameterValues.length);
    for (const value of this.parameterValues) {
      if (value === null) {
        writer.writeInt32(-1);
      } else if (typeof value === "string") {
        writer.writeInt32(value.length);
        writer.encodeInto(value);
      } else if (value instanceof Uint8Array) {
        writer.writeInt32(value.byteLength);
        writer.writeBuffer(value);
      } else {
        throw new TypeError(
          "Expected string Uint8Array, or null for parameter value",
        );
      }
    }

    // result format codes, if applicable
    writer.writeInt16(this.resultFormatCodes.length);
    for (const formatCode of this.resultFormatCodes) {
      writer.writeInt16(formatCode);
    }

    writer.unshift(
      new BinaryWriter(5).writeByte(Bind.CODE).writeInt32(4 + writer.byteLength)
        .buffer,
    );
    return writer.buffer;
  }
}

/**
 * BindComplete (B)
 *
 * @see {@link https://www.postgresql.org/docs/current/protocol-message-formats.html#PROTOCOL-MESSAGE-FORMATS-BINDCOMPLETE PostgreSQL Docs}
 */
export class BindComplete {
  /** '2' */
  static readonly CODE = 0x32;

  get buffer() {
    const writer = new BinaryWriter();
    writer.writeByte(ParseComplete.CODE);
    writer.writeInt32(4);
    return writer.buffer;
  }

  static parse(buffer: Uint8Array) {
    const reader = new BinaryReader(buffer);
    const code = reader.readByte();
    // console.assert(
    //   code === BindComplete.CODE,
    //   `Expected '2', got ${String.fromCharCode(code)}`,
    // );
    const length = reader.readInt32();
    // console.assert(length === 4, `Expected length 4, got ${length}`);
    return new BindComplete();
  }
}

/**
 * CommandComplete (B)
 *
 * @see {@link https://www.postgresql.org/docs/current/protocol-message-formats.html#PROTOCOL-MESSAGE-FORMATS-COMMANDCOMPLETE PostgreSQL Docs}
 */
export class CommandComplete {
  /** 'C' */
  static readonly CODE = 0x43;

  commandTag: string;

  constructor(commandTag: string) {
    this.commandTag = commandTag;
  }

  static parse(buffer: Uint8Array) {
    const reader = new BinaryReader(buffer);
    const code = reader.readByte();
    // console.assert(
    //   code === CommandComplete.CODE,
    //   `Expected 'C', got ${String.fromCharCode(code)}`,
    // );
    const length = reader.readInt32();
    const commandTag = reader.readString();
    return new CommandComplete(commandTag);
  }
}

/**
 * CopyBothResponse (B)
 *
 * @see {@link https://www.postgresql.org/docs/current/protocol-message-formats.html#PROTOCOL-MESSAGE-FORMATS-COPYBOTHRESPONSE PostgreSQL Docs}
 */
export class CopyBothResponse {
  /** 'W' */
  static readonly CODE = 0x57;

  formatCode: number;
  columnFormats: number[];

  constructor(formatCode: number, columnFormats: number[]) {
    this.formatCode = formatCode;
    this.columnFormats = columnFormats;
  }

  static parse(buffer: Uint8Array) {
    const reader = new BinaryReader(buffer);
    const code = reader.readByte();
    // console.assert(
    //   code === CopyBothResponse.CODE,
    //   `Expected ${String.fromCharCode(CopyBothResponse.CODE)}, got ${String.fromCharCode(code)}`,
    // );
    const length = reader.readInt32(); // length
    // console.assert(length === 7, `Expected length 4, got ${length}`);
    const formatCode = reader.readByte();
    const numCols = reader.readInt16();
    const columnFormats = new Array<number>(numCols);
    for (let i = 0; i < numCols; i++) {
      columnFormats[i] = reader.readInt16();
    }
    return new CopyBothResponse(formatCode, columnFormats);
  }
}

/**
 * CopyData (F & B)
 *
 * @see {@link https://www.postgresql.org/docs/current/protocol-message-formats.html#PROTOCOL-MESSAGE-FORMATS-COPYDATA PostgreSQL Docs}
 */
export class CopyData {
  /** 'd' */
  static readonly CODE = 0x64;

  data: Uint8Array;

  constructor(data: Uint8Array) {
    this.data = data;
  }

  get buffer() {
    const writer = new BinaryWriter();
    writer.writeByte(CopyData.CODE);
    writer.writeInt32(4 + this.data.byteLength);
    writer.writeBuffer(this.data);
    return writer.buffer;
  }

  static parse(buffer: Uint8Array) {
    const reader = new BinaryReader(buffer);
    const code = reader.readByte();
    // console.assert(
    //   code === CopyData.CODE,
    //   `Expected ${String.fromCharCode(CopyData.CODE)}, got ${String.fromCharCode(code)}`,
    // );
    const length = reader.readInt32(); // length
    const data = reader.readBuffer(length - 4);
    // console.assert(
    //   reader.remaining === 0,
    //   `Invalid remaining data. Expected 0, got ${reader.remaining}`,
    // );
    return new CopyData(data);
  }
}

/**
 * CopyDone (F & B)
 *
 * @see {@link https://www.postgresql.org/docs/current/protocol-message-formats.html#PROTOCOL-MESSAGE-FORMATS-COPYDONE PostgreSQL Docs}
 */
export class CopyDone {
  /** 'C' */
  static readonly CODE = 0x43;

  get buffer() {
    return new Uint8Array([
      CopyDone.CODE,
      // length of 4
      0x00,
      0x00,
      0x00,
      0x04,
    ]);
  }

  static parse(buffer: Uint8Array) {
    const reader = new BinaryReader(buffer);
    const length = reader.readInt32(); // length
    // console.assert(length === 4, `Expected length 4, got ${length}`);
  }
}

/**
 * CopyFail (F)
 *
 * @see {@link https://www.postgresql.org/docs/current/protocol-message-formats.html#PROTOCOL-MESSAGE-FORMATS-COPYFAIL PostgreSQL Docs}
 */
export class CopyFail {
  /** 'f' */
  static readonly CODE = 0x66;

  errorMessage: string;

  constructor(errorMessage: string) {
    this.errorMessage = errorMessage;
  }

  get buffer() {
    const writer = new BinaryWriter();
    writer.writeByte(CopyFail.CODE);
    writer.writeInt32(this.errorMessage.length + 4);
    writer.writeString(this.errorMessage);
    return writer.buffer;
  }
}

/**
 * CopyInResponse (B)
 *
 * @see {@link https://www.postgresql.org/docs/current/protocol-message-formats.html#PROTOCOL-MESSAGE-FORMATS-COPYINRESPONSE PostgreSQL Docs}
 */
export class CopyInResponse {
  /** 'G' */
  static readonly CODE = 0x47;

  /** The overall COPY format. 0 indicates text, 1 indicates binary. */
  formatCode: number;
  /** The format code of each column in the row. */
  columns: Array<number>;

  constructor(formatCode: number, columns: Array<number>) {
    this.formatCode = formatCode;
    this.columns = columns;
  }

  static parse(buffer: Uint8Array) {
    const reader = new BinaryReader(buffer);
    reader.readByte(); // code
    reader.readInt32(); // length
    const formatCode = reader.readByte();
    const numCols = reader.readInt16();
    const columns = new Array<number>(numCols);
    for (let i = 0; i < numCols; i++) {
      columns[i] = reader.readInt16();
    }
    return new CopyInResponse(formatCode, columns);
  }
}

/**
 * DataRow (B)
 *
 * @see {@link https://www.postgresql.org/docs/current/protocol-message-formats.html#PROTOCOL-MESSAGE-FORMATS-DATAROW PostgreSQL Docs}
 */
export class DataRow {
  /** 'D' */
  static readonly CODE = 0x44;

  columns: ReadonlyArray<Uint8Array | null>;

  constructor(columns: ReadonlyArray<Uint8Array | null>) {
    this.columns = columns;
  }

  static parse(buffer: Uint8Array) {
    const reader = new BinaryReader(buffer);
    const code = reader.readByte();
    // console.assert(
    //   code === DataRow.CODE,
    //   `Expected 'D', got ${String.fromCharCode(code)}`,
    // );
    const length = reader.readInt32();
    const columnCount = reader.readInt16();
    const columns = new Array<Uint8Array | null>(columnCount);
    for (let i = 0; i < columnCount; i++) {
      const columnLength = reader.readInt32();
      if (columnLength === -1) {
        columns[i] = null;
      } else {
        columns[i] = reader.readBuffer(columnLength);
      }
    }
    return new DataRow(columns);
  }
}

/**
 * Describe (F)
 *
 * @see {@link https://www.postgresql.org/docs/current/protocol-message-formats.html#PROTOCOL-MESSAGE-FORMATS-DESCRIBE PostgreSQL Docs}
 */
export class Describe {
  /** 'D' */
  static readonly CODE = 0x44;

  type: "S" | "P";
  name: string;

  constructor(type: "S" | "P", name: string) {
    this.type = type;
    this.name = name;
  }

  get buffer() {
    const writer = new BinaryWriter();
    writer.writeByte(this.type);
    writer.writeString(this.name);
    writer.unshift(
      new BinaryWriter(5)
        .writeByte(Describe.CODE)
        .writeInt32(4 + writer.byteLength).buffer,
    );
    return writer.buffer;
  }
}

/**
 * ErrorResponse (B)
 *
 * @see {@link https://www.postgresql.org/docs/current/protocol-message-formats.html#PROTOCOL-MESSAGE-FORMATS-ERRORRESPONSE PostgreSQL Docs}
 */
export class ErrorResponse {
  /** 'E' */
  static readonly CODE = 0x45;

  fields: ErrorResponsePayload;

  constructor(fields: ErrorResponsePayload) {
    this.fields = fields;
  }

  static parse(buffer: Uint8Array) {
    const reader = new BinaryReader(buffer);

    const code = reader.readByte();
    // console.assert(
    //   code === ErrorResponse.CODE,
    //   `Expected 'E', got ${String.fromCharCode(code)}`,
    // );

    reader.readInt32(); // length, no-op

    const errorResponse: ErrorResponsePayload = {};
    while (reader.remaining > 1) {
      const fieldType = reader.readByte();
      const value = reader.readString();
      switch (fieldType) {
        case 0x56: // 'V' - level
          errorResponse.level = value;
          break;
        case 0x53: // 'S' - Severity
          errorResponse.severity = value;
          break;
        case 0x43: // 'C' - SQLSTATE code
          errorResponse.code = value;
          break;
        case 0x4d: // 'M' - Message
          errorResponse.message = value;
          break;
        case 0x44: // 'D' - Detail
          errorResponse.detail = value;
          break;
        case 0x48: // 'H' - Hint
          errorResponse.hint = value;
          break;
        case 0x50: // 'P' - Position
          errorResponse.position = value;
          break;
        case 0x51: // 'Q' - Internal Query
          errorResponse.internalQuery = value;
          break;
        case 0x57: // 'W' - Where
          errorResponse.where = value;
          break;
        case 0x73: // 's' - Schema
          errorResponse.schema = value;
          break;
        case 0x74: // 't' - Table
          errorResponse.table = value;
          break;
        case 0x63: // 'c' - Column
          errorResponse.column = value;
          break;
        case 0x64: // 'd' - Data Type
          errorResponse.dataType = value;
          break;
        case 0x6e: // 'n' - Constraint
          errorResponse.constraint = value;
          break;
        case 0x46: // 'F' - File
          errorResponse.file = value;
          break;
        case 0x4c: // 'L' - Line
          errorResponse.line = value;
          break;
        case 0x52: // 'R' - Routine
          errorResponse.routine = value;
          break;
        default:
        // console.warn(
        //   `Unknown field type '${String.fromCharCode(fieldType)}'`,
        // );
      }
    }

    const nullTerminator = reader.readByte();
    // console.assert(nullTerminator === 0x0, "Expected null terminator");

    return new ErrorResponse(errorResponse);
  }
}

interface ErrorResponsePayload {
  severity?: string;
  level?: string;
  code?: string; // SQLSTATE code
  message?: string;
  detail?: string;
  hint?: string;
  position?: string;
  internalQuery?: string;
  where?: string;
  schema?: string;
  table?: string;
  column?: string;
  dataType?: string;
  constraint?: string;
  file?: string;
  line?: string;
  routine?: string;
}

/**
 * Execute (F)
 *
 * @see {@link https://www.postgresql.org/docs/current/protocol-message-formats.html#PROTOCOL-MESSAGE-FORMATS-EXECUTE PostgreSQL Docs}
 */
export class Execute {
  /** 'E' */
  static readonly CODE = 0x45;

  /** The name of the portal to execute (an empty string selects the unnamed portal). */
  name: string;
  /** Maximum number of rows to return, if portal contains a query that returns rows (ignored otherwise). Zero denotes “no limit”. */
  limit: number;

  constructor(
    /** The name of the portal to execute (an empty string selects the unnamed portal). */
    name: string = "",
    /** Maximum number of rows to return, if portal contains a query that returns rows (ignored otherwise). Zero denotes “no limit”. */
    limit: number = 0,
  ) {
    this.name = name;
    this.limit = limit;
  }

  get buffer() {
    const writer = new BinaryWriter();
    writer.writeString(this.name);
    writer.writeInt32(this.limit);
    writer.unshift(
      new BinaryWriter(5)
        .writeByte(Execute.CODE)
        .writeInt32(4 + writer.byteLength).buffer,
    );
    return writer.buffer;
  }
}

/**
 * Flush (F)
 *
 * @see {@link https://www.postgresql.org/docs/current/protocol-message-formats.html#PROTOCOL-MESSAGE-FORMATS-FLUSH PostgreSQL Docs}
 */
export class Flush {
  /** 'H' */
  static readonly CODE = 0x48;

  get buffer() {
    const writer = new BinaryWriter(5);
    writer.writeByte(Flush.CODE);
    writer.writeInt32(4);
    return writer.buffer;
  }
}

/**
 * NoData (B)
 *
 * @see {@link https://www.postgresql.org/docs/current/protocol-message-formats.html#PROTOCOL-MESSAGE-FORMATS-NODATA PostgreSQL Docs}
 */
export class NoData {
  /** 'n' */
  static readonly CODE = 0x6e;

  static parse(buffer: Uint8Array) {
    const reader = new BinaryReader(buffer);
    const length = reader.readInt32(); // length
    // console.assert(length === 4, `Expected length 4, got ${length}`);
  }
}

/**
 * ParameterDescription (B)
 *
 * @see {@link https://www.postgresql.org/docs/current/protocol-message-formats.html#PROTOCOL-MESSAGE-FORMATS-PARAMETERDESCRIPTION PostgreSQL Docs}
 */
export class ParameterDescription {
  /** 't' */
  static readonly CODE = 0x74;

  parameterTypes: ReadonlyArray<number>;

  constructor(parameterTypes: ReadonlyArray<number>) {
    this.parameterTypes = parameterTypes;
  }

  static parse(buffer: Uint8Array) {
    const reader = new BinaryReader(buffer);
    const code = reader.readByte();
    // console.assert(
    //   code === ParameterDescription.CODE,
    //   `Expected 't', got ${String.fromCharCode(code)}`,
    // );
    const length = reader.readInt32();
    const numParams = reader.readInt16();
    const paramTypes = new Array<number>(numParams);
    for (let i = 0; i < numParams; i++) {
      paramTypes[i] = reader.readInt32();
    }
    return new ParameterDescription(paramTypes);
  }
}

/**
 * ParameterStatus (B)
 *
 * @see {@link https://www.postgresql.org/docs/current/protocol-message-formats.html#PROTOCOL-MESSAGE-FORMATS-PARAMETERSTATUS PostgreSQL Docs}
 */
export class ParameterStatus {
  /** 'S' */
  static readonly CODE = 0x53;

  parameter: string;
  value: string;

  constructor(parameter: string, value: string) {
    this.parameter = parameter;
    this.value = value;
  }

  static parse(buffer: Uint8Array) {
    const reader = new BinaryReader(buffer);
    const code = reader.readByte();
    // console.assert(
    //   code === ParameterStatus.CODE,
    //   `Expected 'S', got ${String.fromCharCode(code)}`,
    // );
    const length = reader.readInt32();
    const parameter = reader.readString();
    const value = reader.readString();
    return new ParameterStatus(parameter, value);
  }
}

/**
 * Parse (F)
 *
 * @see {@link https://www.postgresql.org/docs/current/protocol-message-formats.html#PROTOCOL-MESSAGE-FORMATS-PARSECOMPLETE PostgreSQL Docs}
 */
export class Parse {
  /** 'P' */
  static readonly CODE = 0x50;

  /** The name of the destination prepared statement (an empty string selects the unnamed prepared statement). */
  name: string;
  /** The query string to be parsed.  */
  query: string;
  paramTypes: number[];

  constructor(name: string, query: string, paramTypes: number[]) {
    this.name = name;
    this.query = query;
    this.paramTypes = paramTypes;
  }

  get buffer() {
    const writer = new BinaryWriter();
    writer.writeString(this.name);
    writer.writeString(this.query);
    writer.writeInt16(this.paramTypes.length);
    for (const paramType of this.paramTypes) {
      writer.writeInt32(paramType);
    }
    writer.unshift(
      new BinaryWriter(5)
        .writeByte(Parse.CODE)
        .writeInt32(4 + writer.byteLength).buffer,
    );
    return writer.buffer;
  }

  static parse(buffer: Uint8Array) {
    const reader = new BinaryReader(buffer);
    const code = reader.readByte();
    // console.assert(
    //   code === Parse.CODE,
    //   `Expected 'P', got ${String.fromCharCode(code)}`,
    // );
    const length = reader.readInt32();
    const name = reader.readString();
    const query = reader.readString();
    const numParamTypes = reader.readInt16();
    const paramTypes = new Array<number>(numParamTypes);
    for (let i = 0; i < numParamTypes; i++) {
      paramTypes[i] = reader.readInt32();
    }
    return new Parse(name, query, paramTypes);
  }
}

/**
 * ParseComplete (B)
 *
 * @see {@link https://www.postgresql.org/docs/current/protocol-message-formats.html#PROTOCOL-MESSAGE-FORMATS-PARSECOMPLETE PostgreSQL Docs}
 */
export class ParseComplete {
  /** '1' */
  static readonly CODE = 0x31;

  get buffer() {
    const writer = new BinaryWriter();
    writer.writeByte(ParseComplete.CODE);
    writer.writeInt32(4);
    return writer.buffer;
  }

  static parse(buffer: Uint8Array) {
    const reader = new BinaryReader(buffer);
    const code = reader.readByte();
    // console.assert(
    //   code === ParseComplete.CODE,
    //   `Expected '1', got ${String.fromCharCode(code)}`,
    // );
    const length = reader.readInt32();
    // console.assert(length === 4, `Expected length 4, got ${length}`);
    return new ParseComplete();
  }
}

/**
 * Query (F)
 *
 * @see {@link https://www.postgresql.org/docs/current/protocol-message-formats.html#PROTOCOL-MESSAGE-FORMATS-QUERY PostgreSQL Docs}
 */
export class Query {
  /** 'Q' */
  static readonly CODE = 0x51;

  sql: string;

  constructor(sql: string) {
    this.sql = sql;
  }

  get buffer() {
    const writer = new BinaryWriter(5 + this.sql.length);
    writer.writeByte(Query.CODE);
    writer.writeInt32(4 + this.sql.length + 1);
    writer.writeString(this.sql);
    return writer.buffer;
  }
}

/**
 * ReadyForQuery (B)
 *
 * @see {@link https://www.postgresql.org/docs/current/protocol-message-formats.html#PROTOCOL-MESSAGE-FORMATS-READYFORQUERY PostgreSQL Docs}
 */
export class ReadyForQuery {
  /** 'Z' */
  static readonly CODE = 0x5a;

  transactionStatus: number;

  constructor(transactionStatus: number) {
    this.transactionStatus = transactionStatus;
  }

  static parse(buffer: Uint8Array) {
    const reader = new BinaryReader(buffer);
    const code = reader.readByte();
    // console.assert(
    //   code === ReadyForQuery.CODE,
    //   `Expected 'Z', got ${String.fromCharCode(code)}`,
    // );
    const length = reader.readInt32();
    // console.assert(length === 5, `Expected length 5, got ${length}`);
    const transactionStatus = reader.readByte();
    return new ReadyForQuery(transactionStatus);
  }
}

/**
 * RowDescription (B)
 *
 * @see {@link https://www.postgresql.org/docs/current/protocol-message-formats.html#PROTOCOL-MESSAGE-FORMATS-ROWDESCRIPTION PostgreSQL Docs}
 */
export class RowDescription {
  /** 'T' */
  static readonly CODE = 0x54;

  columns: Array<RowDescriptionField>;

  constructor(columns: Array<RowDescriptionField>) {
    this.columns = columns;
  }

  static parse(buffer: Uint8Array) {
    const reader = new BinaryReader(buffer);
    const code = reader.readByte();
    // console.assert(
    //   code === RowDescription.CODE,
    //   `Expected 'T', got ${String.fromCharCode(code)}`,
    // );
    const length = reader.readInt32();
    const fieldCount = reader.readInt16();
    const fields = new Array<RowDescriptionField>(fieldCount);
    for (let i = 0; i < fieldCount; i++) {
      const fieldName = reader.readString();
      const relid = reader.readInt32();
      const relseq = reader.readInt16();
      const oid = reader.readInt32();
      const typelen = reader.readInt16();
      const typemod = reader.readInt32();
      const formatCode = reader.readInt16();
      fields[i] = {
        fieldName,
        relid,
        relseq,
        oid,
        typelen,
        typemod,
        formatCode,
      };
    }
    return new RowDescription(fields);
  }
}

interface RowDescriptionField {
  fieldName: string;
  relid: number;
  relseq: number;
  oid: number;
  typelen: number;
  typemod: number;
  formatCode: number;
}

/**
 * SASLInitialResponse (F)
 *
 * @see {@link https://www.postgresql.org/docs/current/protocol-message-formats.html#PROTOCOL-MESSAGE-FORMATS-SASLINITIALRESPONSE PostgreSQL Docs}
 */
export class SASLInitialResponse {
  mechanism: string;
  payload: string | null;

  constructor(mechanism: string, payload?: string) {
    this.mechanism = mechanism;
    this.payload = payload ?? null;
  }

  get buffer() {
    const writer = new BinaryWriter();
    writer.writeString(this.mechanism);
    if (typeof this.payload === "string") {
      writer.writeInt32(this.payload.length);
      writer.encodeInto(this.payload);
    } else {
      writer.writeInt32(-1);
    }

    // length
    writer.unshift(
      new BinaryWriter(4).writeInt32(4 + writer.byteLength).buffer,
    );

    // 'p' code
    writer.unshift(new Uint8Array(["p".charCodeAt(0)]));

    return writer.buffer;
  }
}

/**
 * SASLResponse (F)
 *
 * @see {@link https://www.postgresql.org/docs/current/protocol-message-formats.html#PROTOCOL-MESSAGE-FORMATS-SASLRESPONSE PostgreSQL Docs}
 */
export class SASLResponse {
  payload: string;

  constructor(payload: string) {
    this.payload = payload;
  }

  get buffer() {
    const writer = new BinaryWriter();
    writer.writeByte("p".charCodeAt(0)); // 'p' code
    writer.writeInt32(4 + this.payload.length);
    writer.encodeInto(this.payload);
    return writer.buffer;
  }
}

/**
 * StartupMessage (F)
 *
 * @see {@link https://www.postgresql.org/docs/current/protocol-message-formats.html#PROTOCOL-MESSAGE-FORMATS-STARTUPMESSAGE PostgreSQL Docs}
 */
export class StartupMessage {
  static readonly PROTOCOL_VERSION = [3, 0] as const;

  user: string;
  database: string | null;
  /** @default false */
  replication: boolean | "database";

  constructor(options: {
    user: string;
    database?: string;
    /** @default false */
    replication?: boolean | "database";
  }) {
    this.user = options.user;
    this.database = options.database ?? null;
    this.replication = options.replication ?? false;
  }

  get buffer() {
    const writer = new BinaryWriter();

    // protocol version (3.0)
    writer.writeInt16(StartupMessage.PROTOCOL_VERSION[0]);
    writer.writeInt16(StartupMessage.PROTOCOL_VERSION[1]);

    writer.writeString("user");
    writer.writeString(this.user);

    if (this.database) {
      writer.writeString("database");
      writer.writeString(this.database);
    }

    if (typeof this.replication === "string") {
      writer.writeString("replication");
      writer.writeString(this.replication);
    } else if (typeof this.replication === "boolean") {
      writer.writeString("replication");
      writer.writeString(this.replication ? "true" : "false");
    }

    writer.writeInt8(0);

    // prefix the packet with the packet length
    const lengthWriter = new BinaryWriter(4);
    lengthWriter.writeInt32(4 + writer.byteLength);
    writer.unshift(lengthWriter.buffer);

    return writer.buffer;
  }
}

/**
 * Sync (F)
 *
 * @see {@link https://www.postgresql.org/docs/current/protocol-message-formats.html#PROTOCOL-MESSAGE-FORMATS-SYNC PostgreSQL Docs}
 */
export class Sync {
  /** 'S' */
  static readonly CODE = 0x53;

  get buffer() {
    const writer = new BinaryWriter(5);
    writer.writeByte(Sync.CODE);
    writer.writeInt32(4);
    return writer.buffer;
  }
}

/**
 * Terminate (F)
 *
 * @see {@link https://www.postgresql.org/docs/current/protocol-message-formats.html#PROTOCOL-MESSAGE-FORMATS-TERMINATE PostgreSQL Docs}
 */
export class Terminate {
  /** 'X' */
  static readonly CODE = 0x58;

  get buffer() {
    const writer = new BinaryWriter(5);
    writer.writeByte(Terminate.CODE);
    writer.writeInt32(4);
    return writer.buffer;
  }
}
