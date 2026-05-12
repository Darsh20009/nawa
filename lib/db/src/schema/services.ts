import { Schema, model, type InferSchemaType, type Model } from "mongoose";
import { baseOptions } from "../_helpers";

const serviceSchema = new Schema(
  {
    title: { type: String, required: true },
    titleAr: { type: String, required: true },
    description: { type: String, default: null },
    descriptionAr: { type: String, default: null },
    icon: { type: String, default: null },
    imageUrl: { type: String, default: null },
    order: { type: Number, required: true, default: 0 },
  },
  baseOptions,
);

export type Service = InferSchemaType<typeof serviceSchema> & { id: string; createdAt: Date; updatedAt: Date };
export type InsertService = Omit<Service, "id" | "createdAt" | "updatedAt">;
export const Service: Model<Service> = (globalThis as any).__nawa_Service || model<Service>("Service", serviceSchema);
(globalThis as any).__nawa_Service = Service;
