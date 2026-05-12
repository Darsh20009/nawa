import { Schema, model, type InferSchemaType, type Model } from "mongoose";
import { baseOptions } from "../_helpers";

const messageSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: null },
    subject: { type: String, required: true },
    content: { type: String, required: true },
    status: { type: String, required: true, default: "unread" },
    priority: { type: String, required: true, default: "normal" },
    assignedTo: { type: String, default: null },
  },
  baseOptions,
);

export type Message = InferSchemaType<typeof messageSchema> & { id: string; createdAt: Date; updatedAt: Date };
export type InsertMessage = Omit<Message, "id" | "createdAt" | "updatedAt">;
export const Message: Model<Message> = (globalThis as any).__nawa_Message || model<Message>("Message", messageSchema);
(globalThis as any).__nawa_Message = Message;
