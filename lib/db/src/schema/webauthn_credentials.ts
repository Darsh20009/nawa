import { Schema, model, type InferSchemaType, type Model } from "mongoose";
import { baseOptions } from "../_helpers";

const webAuthnCredentialSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    credentialId: { type: String, required: true, unique: true },
    publicKey: { type: String, required: true },
    counter: { type: Number, required: true, default: 0 },
    transports: { type: [String], default: [] },
    deviceName: { type: String, default: "جهازي" },
  },
  baseOptions,
);

export type WebAuthnCredential = InferSchemaType<typeof webAuthnCredentialSchema> & { id: string; createdAt: Date; updatedAt: Date };
export const WebAuthnCredential: Model<WebAuthnCredential> =
  (globalThis as any).__nawa_WebAuthnCredential ||
  model<WebAuthnCredential>("WebAuthnCredential", webAuthnCredentialSchema);
(globalThis as any).__nawa_WebAuthnCredential = WebAuthnCredential;
