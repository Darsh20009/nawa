import { Schema, model, type InferSchemaType, type Model } from "mongoose";
import { baseOptions } from "../_helpers";

const pushSubscriptionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    userAgent: { type: String, default: null },
  },
  baseOptions,
);

export type PushSubscription = InferSchemaType<typeof pushSubscriptionSchema> & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};
export const PushSubscription: Model<PushSubscription> =
  (globalThis as any).__nawa_PushSubscription ||
  model<PushSubscription>("PushSubscription", pushSubscriptionSchema);
(globalThis as any).__nawa_PushSubscription = PushSubscription;
