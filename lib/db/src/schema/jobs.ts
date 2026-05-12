import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jobsTable = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleAr: text("title_ar").notNull(),
  description: text("description"),
  descriptionAr: text("description_ar"),
  department: text("department").notNull(),
  departmentAr: text("department_ar"),
  type: text("type").notNull().default("full-time"),
  location: text("location"),
  requirements: text("requirements"),
  requirementsAr: text("requirements_ar"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const jobApplicationsTable = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobsTable.id, { onDelete: "cascade" }),
  applicantName: text("applicant_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  nationality: text("nationality"),
  city: text("city"),
  currentPosition: text("current_position"),
  yearsExperience: integer("years_experience"),
  education: text("education"),
  linkedinUrl: text("linkedin_url"),
  portfolioUrl: text("portfolio_url"),
  expectedSalary: text("expected_salary"),
  noticePeriod: text("notice_period"),
  whyJoinUs: text("why_join_us"),
  howDidYouHear: text("how_did_you_hear"),
  coverLetter: text("cover_letter"),
  resumeUrl: text("resume_url"),
  status: text("status").notNull().default("pending"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertJobSchema = createInsertSchema(jobsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertJobApplicationSchema = createInsertSchema(jobApplicationsTable).omit({ id: true, createdAt: true, updatedAt: true, status: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobsTable.$inferSelect;
export type JobApplication = typeof jobApplicationsTable.$inferSelect;
