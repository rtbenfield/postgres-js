import { expect, test } from "vitest";
import { Client } from "../src/client.js";
import { Connection } from "../src/connection.js";
import { NodeSocket } from "../src/node/socket.node.js";

test("connect", async () => {
  const client = new Client({
    connection: {
      hostname: "localhost",
      port: 5432,
    },
    socket: (hostname, port) => Promise.resolve(new NodeSocket(hostname, port)),
  });
  await using connection = await client.connect();
  expect(connection).toBeInstanceOf(Connection);
});
