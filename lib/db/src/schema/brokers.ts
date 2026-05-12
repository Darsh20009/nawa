import { Schema, model, type InferSchemaType, type Model } from "mongoose";
import { baseOptions } from "../_helpers";

const brokerSchema = new Schema(
  {
    name: { type: String, required: true },
    nameAr: { type: String, required: true },
    email: { type: String, default: null },
    phone: { type: String, default: null },
    specialization: { type: String, default: null },
    specializationAr: { type: String, default: null },
    bio: { type: String, default: null },
    bioAr: { type: String, default: null },
    avatar: { type: String, default: null },
    rating: { type: Number, default: null },
    dealsCount: { type: Number, default: null },
    active: { type: Boolean, required: true, default: true },
  },
  baseOptions,
);

export type Broker = InferSchemaType<typeof brokerSchema> & { id: string; createdAt: Date; updatedAt: Date };
export type InsertBroker = Omit<Broker, "id" | "createdAt" | "updatedAt">;
export const Broker: Model<Broker> = (globalThis as any).__nawa_Broker || model<Broker>("Broker", brokerSchema);
(globalThis as any).__nawa_Broker = Broker;
