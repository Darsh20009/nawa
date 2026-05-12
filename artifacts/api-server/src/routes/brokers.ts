import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { brokersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

const toDto = (b: typeof brokersTable.$inferSelect) => ({
  ...b,
  createdAt: b.createdAt.toISOString(),
  updatedAt: b.updatedAt.toISOString(),
});

router.get("/brokers", async (_req, res): Promise<void> => {
  const results = await db.select().from(brokersTable);
  res.json(results.map(toDto));
});

router.post("/brokers", requireAdmin, async (req, res): Promise<void> => {
  const [broker] = await db.insert(brokersTable).values(req.body).returning();
  res.status(201).json(toDto(broker));
});

router.patch("/brokers/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [broker] = await db.update(brokersTable).set(req.body).where(eq(brokersTable.id, id)).returning();
  if (!broker) { res.status(404).json({ error: "Not found" }); return; }
  res.json(toDto(broker));
});

router.delete("/brokers/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(brokersTable).where(eq(brokersTable.id, id));
  res.sendStatus(204);
});

export default router;
