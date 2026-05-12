import { Schema, model, type InferSchemaType, type Model } from "mongoose";
import { baseOptions } from "../_helpers";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    nameAr: { type: String, default: null },
    role: { type: String, required: true, default: "support" },
    department: { type: String, default: null },
    avatar: { type: String, default: null },
    phone: { type: String, default: null },
    active: { type: Boolean, required: true, default: true },
    permissions: { type: String, default: null },
    emailAccount: { type: String, default: null },
  },
  baseOptions,
);

export type User = InferSchemaType<typeof userSchema> & { id: string; createdAt: Date; updatedAt: Date };
export type InsertUser = Omit<User, "id" | "createdAt" | "updatedAt">;
export const User: Model<User> = (globalThis as any).__nawa_User || model<User>("User", userSchema);
(globalThis as any).__nawa_User = User;
