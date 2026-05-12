import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { pagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

const toDto = (p: typeof pagesTable.$inferSelect) => ({
  ...p,
  createdAt: p.createdAt.toISOString(),
  updatedAt: p.updatedAt.toISOString(),
});

router.get("/pages", async (_req, res): Promise<void> => {
  const results = await db.select().from(pagesTable);
  res.json(results.map(toDto));
});

router.post("/pages", requireAdmin, async (req, res): Promise<void> => {
  const [page] = await db.insert(pagesTable).values(req.body).returning();
  res.status(201).json(toDto(page));
});

router.get("/pages/:slug", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const [page] = await db.select().from(pagesTable).where(eq(pagesTable.slug, slug));
  if (!page) { res.status(404).json({ error: "Page not found" }); return; }
  res.json(toDto(page));
});

router.patch("/pages/:slug", requireAdmin, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const [page] = await db.update(pagesTable).set(req.body).where(eq(pagesTable.slug, slug)).returning();
  if (!page) { res.status(404).json({ error: "Page not found" }); return; }
  res.json(toDto(page));
});

router.delete("/pages/:slug", requireAdmin, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  await db.delete(pagesTable).where(eq(pagesTable.slug, slug));
  res.sendStatus(204);
});

export default router;
