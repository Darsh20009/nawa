import { Schema, model, Types, type InferSchemaType, type Model } from "mongoose";
import { baseOptions } from "../_helpers";

const jobSchema = new Schema(
  {
    title: { type: String, required: true },
    titleAr: { type: String, required: true },
    description: { type: String, default: null },
    descriptionAr: { type: String, default: null },
    department: { type: String, required: true },
    departmentAr: { type: String, default: null },
    type: { type: String, required: true, default: "full-time" },
    location: { type: String, default: null },
    requirements: { type: String, default: null },
    requirementsAr: { type: String, default: null },
    active: { type: Boolean, required: true, default: true },
  },
  baseOptions,
);

export type Job = InferSchemaType<typeof jobSchema> & { id: string; createdAt: Date; updatedAt: Date };
export type InsertJob = Omit<Job, "id" | "createdAt" | "updatedAt">;
export const Job: Model<Job> = (globalThis as any).__nawa_Job || model<Job>("Job", jobSchema);
(globalThis as any).__nawa_Job = Job;

const jobAppSchema: Schema = new Schema(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    applicantName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: null },
    nationality: { type: String, default: null },
    city: { type: String, default: null },
    currentPosition: { type: String, default: null },
    yearsExperience: { type: Number, default: null },
    education: { type: String, default: null },
    linkedinUrl: { type: String, default: null },
    portfolioUrl: { type: String, default: null },
    expectedSalary: { type: String, default: null },
    noticePeriod: { type: String, default: null },
    whyJoinUs: { type: String, default: null },
    howDidYouHear: { type: String, default: null },
    coverLetter: { type: String, default: null },
    resumeUrl: { type: String, default: null },
    status: { type: String, required: true, default: "pending" },
    adminNotes: { type: String, default: null },
  },
  {
    ...baseOptions,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: any) => {
        ret.id = ret._id?.toString();
        if (ret.jobId && typeof ret.jobId !== "string") ret.jobId = ret.jobId.toString();
        delete ret._id;
        return ret;
      },
    },
  },
);

export type JobApplication = InferSchemaType<typeof jobAppSchema> & { id: string; jobId: string | Types.ObjectId; createdAt: Date; updatedAt: Date };
export const JobApplication: Model<JobApplication> = (globalThis as any).__nawa_JobApp || model<JobApplication>("JobApplication", jobAppSchema);
(globalThis as any).__nawa_JobApp = JobApplication;
