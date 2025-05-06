import { test } from "vitest";
import { Client } from "../src/client.js";
import { NodeSocket } from "../src/node/socket.node.js";

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
});
