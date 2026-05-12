import http from "http";
import app from "./app";
import { logger } from "./lib/logger";
import { attachChatSocket } from "./lib/chatSocket";
import { connectDb } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = http.createServer(app);
attachChatSocket(server);

connectDb()
  .then(() => {
    server.listen(port, () => {
      logger.info({ port }, "Server listening (HTTP + WS)");
    });
  })
  .catch((err) => {
    logger.error({ err: err.message }, "Failed to connect to MongoDB; aborting");
    process.exit(1);
  });
