import { Schema, model, type InferSchemaType, type Model } from "mongoose";
import { baseOptions } from "../_helpers";

// =====================================================================
// AiConversation: every AI interaction logged for review + improvement
// =====================================================================
const aiMessageSchema = new Schema(
  {
    role: { type: String, enum: ["system", "user", "assistant", "tool"], required: true },
    content: { type: String, required: true, default: "" },
    at: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const aiConversationSchema = new Schema(
  {
    // Channel where the AI was used
    channel: {
      type: String,
      enum: [
        "public-chat",      // visitor chatbot widget
        "employee-chat",    // /admin/ai or /employee/ai assistant
        "text-action",      // AIWriteAssist (improve/translate/etc)
        "smart-reply",      // email AI reply
        "summarize",        // email summary
        "classify",         // contact-message classifier
        "auto-reply",       // automatic reply on new contact form
      ],
      required: true,
      index: true,
    },
    // Optional sub-action (e.g. "improve", "translate_ar" for text-action)
    action: { type: String, default: null, index: true },
    // Who used it (null for public visitors)
    userId: { type: String, default: null, index: true },
    userName: { type: String, default: null },
    userRole: { type: String, default: null },
    // For public chatbot
    visitorIp: { type: String, default: null },
    visitorUserAgent: { type: String, default: null },
    // The actual exchange — single-shot for text-action, full thread for chat
    messages: { type: [aiMessageSchema], default: [] },
    // First user input + final AI output for fast list view
    inputPreview: { type: String, default: "" },
    outputPreview: { type: String, default: "" },
    // Quality marks (admin curation)
    rating: { type: String, enum: ["good", "bad", null], default: null, index: true },
    reviewedBy: { type: String, default: null },
    reviewNote: { type: String, default: null },
    // Derived/parsed extras
    durationMs: { type: Number, default: 0 },
    model: { type: String, default: null },
  },
  baseOptions,
);
aiConversationSchema.index({ createdAt: -1 });
aiConversationSchema.index({ channel: 1, createdAt: -1 });

export type AiConversation = InferSchemaType<typeof aiConversationSchema> & { id: string; createdAt: Date; updatedAt: Date };
export type InsertAiConversation = Omit<AiConversation, "id" | "createdAt" | "updatedAt">;
export const AiConversation: Model<AiConversation> =
  (globalThis as any).__nawa_AiConversation || model<AiConversation>("AiConversation", aiConversationSchema);
(globalThis as any).__nawa_AiConversation = AiConversation;

// =====================================================================
// AiLearning: curated Q→A pairs the AI uses to improve future answers
// (lightweight RAG — no fine-tuning needed)
// =====================================================================
const aiLearningSchema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    channel: { type: String, default: "public-chat", index: true },
    tags: { type: [String], default: [] },
    sourceConversationId: { type: String, default: null },
    approvedBy: { type: String, required: true },
    enabled: { type: Boolean, default: true, index: true },
    useCount: { type: Number, default: 0 },
  },
  baseOptions,
);
aiLearningSchema.index({ createdAt: -1 });

export type AiLearning = InferSchemaType<typeof aiLearningSchema> & { id: string; createdAt: Date; updatedAt: Date };
export type InsertAiLearning = Omit<AiLearning, "id" | "createdAt" | "updatedAt">;
export const AiLearning: Model<AiLearning> =
  (globalThis as any).__nawa_AiLearning || model<AiLearning>("AiLearning", aiLearningSchema);
(globalThis as any).__nawa_AiLearning = AiLearning;
