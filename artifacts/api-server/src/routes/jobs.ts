import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { jobsTable, jobApplicationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

const jobDto = (j: typeof jobsTable.$inferSelect) => ({
  ...j,
  createdAt: j.createdAt.toISOString(),
  updatedAt: j.updatedAt.toISOString(),
});

const appDto = (a: typeof jobApplicationsTable.$inferSelect) => ({
  ...a,
  createdAt: a.createdAt.toISOString(),
  updatedAt: a.updatedAt.toISOString(),
});

const parseId = (raw: unknown): number => {
  const s = Array.isArray(raw) ? raw[0] : raw;
  return parseInt(String(s), 10);
};

router.get("/jobs", async (req, res): Promise<void> => {
  const results = await db.select().from(jobsTable).orderBy(desc(jobsTable.createdAt));
  const { department } = req.query;
  let filtered = results;
  if (department) filtered = filtered.filter(j => j.department === department);
  res.json(filtered.map(jobDto));
});

router.post("/jobs", requireAdmin, async (req, res): Promise<void> => {
  const [job] = await db.insert(jobsTable).values(req.body).returning();
  res.status(201).json(jobDto(job));
});

router.patch("/jobs/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [job] = await db.update(jobsTable).set(req.body).where(eq(jobsTable.id, id)).returning();
  if (!job) { res.status(404).json({ error: "Not found" }); return; }
  res.json(jobDto(job));
});

router.delete("/jobs/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(jobsTable).where(eq(jobsTable.id, id));
  res.sendStatus(204);
});

// Public application submission
function safeUrl(input: unknown): string | null {
  if (typeof input !== "string" || !input.trim()) return null;
  const v = input.trim().slice(0, 2048);
  // Allow http(s) absolute URLs OR our own relative storage paths
  if (v.startsWith("/api/storage/")) return v;
  try {
    const u = new URL(v);
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
    return null;
  } catch {
    return null;
  }
}

router.post("/jobs/:id/apply", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const b = req.body ?? {};
  if (!b.applicantName || !b.email) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [app] = await db.insert(jobApplicationsTable).values({
    jobId: id,
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
  }).returning();
  res.status(201).json(appDto(app));
});

// Admin: list all applications
router.get("/jobs/applications", requireAdmin, async (_req, res): Promise<void> => {
  const results = await db.select().from(jobApplicationsTable).orderBy(desc(jobApplicationsTable.createdAt));
  res.json(results.map(appDto));
});

// Admin: update application status / notes
router.patch("/jobs/applications/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const patch: Partial<typeof jobApplicationsTable.$inferInsert> = {};
  if (typeof req.body?.status === "string") patch.status = req.body.status;
  if (typeof req.body?.adminNotes === "string") patch.adminNotes = req.body.adminNotes;
  if (Object.keys(patch).length === 0) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }
  const [app] = await db.update(jobApplicationsTable).set(patch).where(eq(jobApplicationsTable.id, id)).returning();
  if (!app) { res.status(404).json({ error: "Not found" }); return; }
  res.json(appDto(app));
});

// Admin: delete an application
router.delete("/jobs/applications/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(jobApplicationsTable).where(eq(jobApplicationsTable.id, id));
  res.sendStatus(204);
});

export default router;
