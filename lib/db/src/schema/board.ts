import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const boardMembersTable = pgTable("board_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  position: text("position").notNull(),
  positionAr: text("position_ar").notNull(),
  bio: text("bio"),
  bioAr: text("bio_ar"),
  avatar: text("avatar"),
  linkedIn: text("linked_in"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBoardMemberSchema = createInsertSchema(boardMembersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBoardMember = z.infer<typeof insertBoardMemberSchema>;
export type BoardMember = typeof boardMembersTable.$inferSelect;
