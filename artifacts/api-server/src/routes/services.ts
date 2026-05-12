import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { servicesTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/services", async (_req, res): Promise<void> => {
  const results = await db.select().from(servicesTable).orderBy(asc(servicesTable.order));
  res.json(results.map(s => ({ ...s, createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString() })));
});

router.post("/services", requireAdmin, async (req, res): Promise<void> => {
  const [service] = await db.insert(servicesTable).values(req.body).returning();
  res.status(201).json({ ...service, createdAt: service.createdAt.toISOString(), updatedAt: service.updatedAt.toISOString() });
});

router.patch("/services/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [service] = await db.update(servicesTable).set(req.body).where(eq(servicesTable.id, id)).returning();
  if (!service) { res.status(404).json({ error: "Service not found" }); return; }
  res.json({ ...service, createdAt: service.createdAt.toISOString(), updatedAt: service.updatedAt.toISOString() });
});

router.delete("/services/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(servicesTable).where(eq(servicesTable.id, id));
  res.sendStatus(204);
});

export default router;
