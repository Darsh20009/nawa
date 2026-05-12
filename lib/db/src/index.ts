import mongoose from "mongoose";
import { logger } from "./logger";

export * from "./schema";
export { Types } from "mongoose";

let connectPromise: Promise<typeof mongoose> | null = null;

function buildUri(): string {
  const direct = process.env.MONGODB_URI?.trim();
  if (direct) return direct;

  const user = process.env.MONGODB_USERNAME?.trim();
  const pass = process.env.MONGODB_PASSWORD?.trim();
  if (user && pass) {
    const cluster = process.env.MONGODB_CLUSTER?.trim() || "cluster0.mongodb.net";
    const dbName = process.env.MONGODB_DB?.trim() || "nawa";
    return `mongodb+srv://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${cluster}/${dbName}?retryWrites=true&w=majority`;
  }
  throw new Error("MONGODB_URI (or MONGODB_USERNAME + MONGODB_PASSWORD) must be set");
}

export async function connectDb(): Promise<typeof mongoose> {
  if (connectPromise) return connectPromise;
  const uri = buildUri();
  mongoose.set("strictQuery", true);
  connectPromise = mongoose
    .connect(uri, { serverSelectionTimeoutMS: 15000 })
    .then((m) => {
      logger.info({ db: m.connection.name, host: m.connection.host }, "MongoDB connected");
      return m;
    })
    .catch((err) => {
      connectPromise = null;
      logger.error({ err: err.message }, "MongoDB connection failed");
      throw err;
    });
  return connectPromise;
}

export { mongoose };
