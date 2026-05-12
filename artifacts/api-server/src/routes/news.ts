import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { newsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

const toDto = (n: typeof newsTable.$inferSelect) => ({
  ...n,
  publishedAt: n.publishedAt ? n.publishedAt.toISOString() : null,
  createdAt: n.createdAt.toISOString(),
  updatedAt: n.updatedAt.toISOString(),
});

router.get("/news", async (req, res): Promise<void> => {
  const results = await db.select().from(newsTable).orderBy(desc(newsTable.createdAt));
  const { category, featured } = req.query;
  let filtered = results;
  if (category) filtered = filtered.filter(n => n.category === category);
  if (featured === "true") filtered = filtered.filter(n => n.featured);
  res.json(filtered.map(toDto));
});

router.post("/news", requireAdmin, async (req, res): Promise<void> => {
  const body = req.body;
  const [article] = await db.insert(newsTable).values({
    ...body,
    publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
  }).returning();
  res.status(201).json(toDto(article));
});

router.get("/news/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [article] = await db.select().from(newsTable).where(eq(newsTable.id, id));
  if (!article) { res.status(404).json({ error: "Not found" }); return; }
  res.json(toDto(article));
});

router.patch("/news/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const body = req.body;
  const [article] = await db.update(newsTable).set({
    ...body,
    publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined,
  }).where(eq(newsTable.id, id)).returning();
  if (!article) { res.status(404).json({ error: "Not found" }); return; }
  res.json(toDto(article));
});

router.delete("/news/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(newsTable).where(eq(newsTable.id, id));
  res.sendStatus(204);
});

export default router;
