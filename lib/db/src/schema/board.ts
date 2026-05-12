import { Schema, model, type InferSchemaType, type Model } from "mongoose";
import { baseOptions } from "../_helpers";

const boardMemberSchema = new Schema(
  {
    name: { type: String, required: true },
    nameAr: { type: String, required: true },
    position: { type: String, required: true },
    positionAr: { type: String, required: true },
    bio: { type: String, default: null },
    bioAr: { type: String, default: null },
    avatar: { type: String, default: null },
    linkedIn: { type: String, default: null },
    order: { type: Number, required: true, default: 0 },
  },
  baseOptions,
);

export type BoardMember = InferSchemaType<typeof boardMemberSchema> & { id: string; createdAt: Date; updatedAt: Date };
export type InsertBoardMember = Omit<BoardMember, "id" | "createdAt" | "updatedAt">;
export const BoardMember: Model<BoardMember> = (globalThis as any).__nawa_BoardMember || model<BoardMember>("BoardMember", boardMemberSchema);
(globalThis as any).__nawa_BoardMember = BoardMember;
