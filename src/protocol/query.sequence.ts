import {
  CommandComplete,
  DataRow,
  ErrorResponse,
  Query,
  ReadyForQuery,
  RowDescription,
} from "./message-formats.js";
import { type SequenceStream } from "./sequence.js";

/**
 * @see @link{https://www.postgresql.org/docs/current/protocol-flow.html#PROTOCOL-FLOW-SIMPLE-QUERY PostgreSQL Docs}
 */
export async function* simpleQuerySequence(
  sql: string,
): SequenceStream<DataRow> {
  // TODO: this is a minimal implementation that does not handle much yet
  let reply = yield new Query(sql).buffer;
  let rowDescriptions = new Array<RowDescription>();
  switch (reply[0]) {
    case ErrorResponse.CODE: {
      const errorResponse = ErrorResponse.parse(reply);
      throw errorResponse;
    }
    case RowDescription.CODE: {
      const rowDescription = RowDescription.parse(reply);
      rowDescriptions.push(rowDescription);
    }
  }
  return new TransformStream<Uint8Array, DataRow>({
    transform(chunk, controller) {
      switch (chunk[0]) {
        case DataRow.CODE: {
          const dataRow = DataRow.parse(chunk);
          controller.enqueue(dataRow);
          break;
        }
        case CommandComplete.CODE: {
          CommandComplete.parse(chunk);
          break;
        }
        case ReadyForQuery.CODE: {
          ReadyForQuery.parse(chunk);
          controller.terminate();
          break;
        }
      }
    },
  });
}
