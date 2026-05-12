import { Schema, model, type InferSchemaType, type Model } from "mongoose";
import { baseOptions } from "../_helpers";

const newsSchema = new Schema(
  {
    title: { type: String, required: true },
    titleAr: { type: String, required: true },
    content: { type: String, default: null },
    contentAr: { type: String, default: null },
    category: { type: String, required: true, default: "news" },
    imageUrl: { type: String, default: null },
    featured: { type: Boolean, required: true, default: false },
    publishedAt: { type: Date, default: null },
  },
  baseOptions,
);

export type News = InferSchemaType<typeof newsSchema> & { id: string; createdAt: Date; updatedAt: Date };
export type InsertNews = Omit<News, "id" | "createdAt" | "updatedAt">;
export const News: Model<News> = (globalThis as any).__nawa_News || model<News>("News", newsSchema);
(globalThis as any).__nawa_News = News;
