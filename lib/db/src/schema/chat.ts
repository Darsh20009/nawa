import { Schema, model, Types, type InferSchemaType, type Model } from "mongoose";
import { baseOptions } from "../_helpers";

const conversationSchema = new Schema(
  {
    title: { type: String, required: true },
    isGroup: { type: Boolean, required: true, default: false },
    participants: { type: [String], default: [] },
    lastMessage: { type: String, default: null },
    unreadCount: { type: Number, required: true, default: 0 },
  },
  baseOptions,
);
conversationSchema.index({ updatedAt: -1 });

export type Conversation = InferSchemaType<typeof conversationSchema> & { id: string; createdAt: Date; updatedAt: Date };
export type InsertConversation = Omit<Conversation, "id" | "createdAt" | "updatedAt">;
export const Conversation: Model<Conversation> = (globalThis as any).__nawa_Conversation || model<Conversation>("Conversation", conversationSchema);
(globalThis as any).__nawa_Conversation = Conversation;

const chatMessageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true, default: "" },
    senderAvatar: { type: String, default: null },
    content: { type: String, required: true },
    type: { type: String, required: true, default: "text" },
    fileUrl: { type: String, default: null },
    readBy: { type: [String], default: [] },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: any) => {
        ret.id = ret._id?.toString();
        if (ret.conversationId && typeof ret.conversationId !== "string") ret.conversationId = ret.conversationId.toString();
        delete ret._id;
        return ret;
      },
    },
  },
);
chatMessageSchema.index({ conversationId: 1, createdAt: 1 });

export type ChatMessage = InferSchemaType<typeof chatMessageSchema> & { id: string; conversationId: string | Types.ObjectId; createdAt: Date };
export const ChatMessage: Model<ChatMessage> = (globalThis as any).__nawa_ChatMessage || model<ChatMessage>("ChatMessage", chatMessageSchema);
(globalThis as any).__nawa_ChatMessage = ChatMessage;
