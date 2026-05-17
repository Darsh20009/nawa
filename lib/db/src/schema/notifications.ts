import { Schema, model, type InferSchemaType, type Model } from "mongoose";
import { baseOptions } from "../_helpers";

const notificationSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, required: true, default: "info" },
    title: { type: String, required: true },
    body: { type: String, required: true },
    link: { type: String, default: null },
    icon: { type: String, default: "🔔" },
    read: { type: Boolean, required: true, default: false },
    tag: { type: String, default: null },
  },
  baseOptions,
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export type Notification = InferSchemaType<typeof notificationSchema> & { id: string; createdAt: Date; updatedAt: Date };
export const Notification: Model<Notification> =
  (globalThis as any).__nawa_Notification ||
  model<Notification>("Notification", notificationSchema);
(globalThis as any).__nawa_Notification = Notification;
