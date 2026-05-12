import { Router, type IRouter } from "express";
import { Types } from "@workspace/db";
import { Job, JobApplication } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();
const isValidId = (id: string) => Types.ObjectId.isValid(id);

router.get("/jobs", async (req, res): Promise<void> => {
  const filter: Record<string, unknown> = {};
  if (req.query.department) filter.department = req.query.department;
  const results = await Job.find(filter).sort({ createdAt: -1 });
  res.json(results.map(j => j.toJSON()));
});

router.post("/jobs", requireAdmin, async (req, res): Promise<void> => {
  const job = await Job.create(req.body);
  res.status(201).json(job.toJSON());
});

// Admin: list all applications — MUST come before /jobs/:id matchers
router.get("/jobs/applications", requireAdmin, async (_req, res): Promise<void> => {
  const results = await JobApplication.find().sort({ createdAt: -1 });
  res.json(results.map(a => a.toJSON()));
});

router.patch("/jobs/applications/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!isValidId(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const patch: Record<string, unknown> = {};
  if (typeof req.body?.status === "string") patch.status = req.body.status;
  if (typeof req.body?.adminNotes === "string") patch.adminNotes = req.body.adminNotes;
  if (Object.keys(patch).length === 0) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }
  const app = await JobApplication.findByIdAndUpdate(id, patch, { new: true });
  if (!app) { res.status(404).json({ error: "Not found" }); return; }
  res.json(app.toJSON());
});

router.delete("/jobs/applications/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!isValidId(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await JobApplication.findByIdAndDelete(id);
  res.sendStatus(204);
});

router.patch("/jobs/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!isValidId(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const job = await Job.findByIdAndUpdate(id, req.body, { new: true });
  if (!job) { res.status(404).json({ error: "Not found" }); return; }
  res.json(job.toJSON());
});

router.delete("/jobs/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!isValidId(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await Job.findByIdAndDelete(id);
  res.sendStatus(204);
});

function safeUrl(input: unknown): string | null {
  if (typeof input !== "string" || !input.trim()) return null;
  const v = input.trim().slice(0, 2048);
  if (v.startsWith("/api/storage/")) return v;
  try {
    const u = new URL(v);
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
    return null;
  } catch { return null; }
}

router.post("/jobs/:id/apply", async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!isValidId(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const b = req.body ?? {};
  if (!b.applicantName || !b.email) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const app = await JobApplication.create({
    jobId: new Types.ObjectId(id),
    applicantName: String(b.applicantName).slice(0, 200),
    email: String(b.email).slice(0, 200),
    phone: b.phone ? String(b.phone).slice(0, 50) : null,
    nationality: b.nationality ? String(b.nationality).slice(0, 100) : null,
    city: b.city ? String(b.city).slice(0, 100) : null,
    currentPosition: b.currentPosition ? String(b.currentPosition).slice(0, 200) : null,
    yearsExperience: b.yearsExperience != null ? Number(b.yearsExperience) : null,
    education: b.education ? String(b.education).slice(0, 200) : null,
    linkedinUrl: safeUrl(b.linkedinUrl),
    portfolioUrl: safeUrl(b.portfolioUrl),
    expectedSalary: b.expectedSalary ? String(b.expectedSalary).slice(0, 100) : null,
    noticePeriod: b.noticePeriod ? String(b.noticePeriod).slice(0, 100) : null,
    whyJoinUs: b.whyJoinUs ? String(b.whyJoinUs).slice(0, 4000) : null,
    howDidYouHear: b.howDidYouHear ? String(b.howDidYouHear).slice(0, 200) : null,
    coverLetter: b.coverLetter ? String(b.coverLetter).slice(0, 4000) : null,
    resumeUrl: safeUrl(b.resumeUrl),
  });
  res.status(201).json(app.toJSON());
});

export default router;
