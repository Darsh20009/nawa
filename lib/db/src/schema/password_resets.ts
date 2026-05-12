import { Schema, model, type InferSchemaType, type Model } from "mongoose";
import { baseOptions } from "../_helpers";

const passwordResetSchema: Schema = new Schema(
  {
    email: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, required: true, default: false },
  },
  { ...baseOptions, timestamps: { createdAt: true, updatedAt: false } },
);

export type PasswordReset = InferSchemaType<typeof passwordResetSchema> & { id: string; createdAt: Date };
export const PasswordReset: Model<PasswordReset> = (globalThis as any).__nawa_PR || model<PasswordReset>("PasswordReset", passwordResetSchema);
(globalThis as any).__nawa_PR = PasswordReset;
