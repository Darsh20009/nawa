import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleAr: text("title_ar").notNull(),
  description: text("description"),
  descriptionAr: text("description_ar"),
  location: text("location"),
  locationAr: text("location_ar"),
  status: text("status").notNull().default("planning"),
  type: text("type"),
  totalUnits: integer("total_units"),
  availableUnits: integer("available_units"),
  completionPercentage: integer("completion_percentage"),
  imageUrl: text("image_url"),
  images: text("images"),
  featured: boolean("featured").notNull().default(false),
  price: text("price"),
  area: text("area"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
