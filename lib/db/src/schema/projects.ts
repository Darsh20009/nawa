import { Schema, model, type InferSchemaType, type Model } from "mongoose";
import { baseOptions } from "../_helpers";

const projectSchema = new Schema(
  {
    title: { type: String, required: true },
    titleAr: { type: String, required: true },
    description: { type: String, default: null },
    descriptionAr: { type: String, default: null },
    location: { type: String, default: null },
    locationAr: { type: String, default: null },
    status: { type: String, required: true, default: "planning" },
    type: { type: String, default: null },
    totalUnits: { type: Number, default: null },
    availableUnits: { type: Number, default: null },
    completionPercentage: { type: Number, default: null },
    imageUrl: { type: String, default: null },
    images: { type: String, default: null },
    featured: { type: Boolean, required: true, default: false },
    price: { type: String, default: null },
    area: { type: String, default: null },
  },
  baseOptions,
);

export type Project = InferSchemaType<typeof projectSchema> & { id: string; createdAt: Date; updatedAt: Date };
export type InsertProject = Omit<Project, "id" | "createdAt" | "updatedAt">;
export const Project: Model<Project> = (globalThis as any).__nawa_Project || model<Project>("Project", projectSchema);
(globalThis as any).__nawa_Project = Project;
