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
});

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
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [job] = await db.update(jobsTable).set(req.body).where(eq(jobsTable.id, id)).returning();
  if (!job) { res.status(404).json({ error: "Not found" }); return; }
  res.json(jobDto(job));
});

router.delete("/jobs/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(jobsTable).where(eq(jobsTable.id, id));
  res.sendStatus(204);
});

router.post("/jobs/:id/apply", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [app] = await db.insert(jobApplicationsTable).values({
    jobId: id,
    applicantName: req.body.applicantName,
    email: req.body.email,
    phone: req.body.phone,
    coverLetter: req.body.coverLetter,
    resumeUrl: req.body.resumeUrl,
  }).returning();
  res.status(201).json(appDto(app));
});

router.get("/jobs/applications", requireAdmin, async (_req, res): Promise<void> => {
  const results = await db.select().from(jobApplicationsTable).orderBy(desc(jobApplicationsTable.createdAt));
  res.json(results.map(appDto));
});

export default router;
