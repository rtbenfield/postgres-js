import { expect, test } from "vitest";
import { Client } from "../src/client.js";
import { NodeSocket } from "../src/node/socket.node.js";
import { simpleQuerySequence } from "../src/protocol/query.sequence.js";

test("connect", async () => {
  const client = new Client({
    connection: {
      database: "postgres",
      hostname: "localhost",
      port: 5432,
      password: "password",
      username: "user",
    },
    socket: (hostname, port) => Promise.resolve(new NodeSocket(hostname, port)),
  });
  await using connection = await client.connect();
  const stream = await connection.stream(simpleQuerySequence("SELECT 1"));
  const rows = await streamToArray(stream);
  expect(rows.length).toBe(1);
  expect(rows).toMatchInlineSnapshot(`
    [
      DataRow {
        "columns": [
          Uint8Array [
            49,
          ],
        ],
      },
    ]
  `);
});

async function streamToArray<T>(stream: ReadableStream<T>): Promise<T[]> {
  const array = new Array<T>();
  for await (const item of stream) {
    array.push(item);
  }
  return array;
}
  
