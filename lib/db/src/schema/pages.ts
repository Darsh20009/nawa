import { Schema, model, type InferSchemaType, type Model } from "mongoose";
import { baseOptions } from "../_helpers";

const pageSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    titleAr: { type: String, required: true },
    content: { type: String, default: null },
    contentAr: { type: String, default: null },
    metaTitle: { type: String, default: null },
    metaDescription: { type: String, default: null },
    metaDescriptionAr: { type: String, default: null },
    published: { type: Boolean, required: true, default: false },
  },
  baseOptions,
);

export type Page = InferSchemaType<typeof pageSchema> & { id: string; createdAt: Date; updatedAt: Date };
export type InsertPage = Omit<Page, "id" | "createdAt" | "updatedAt">;
export const Page: Model<Page> = (globalThis as any).__nawa_Page || model<Page>("Page", pageSchema);
(globalThis as any).__nawa_Page = Page;
