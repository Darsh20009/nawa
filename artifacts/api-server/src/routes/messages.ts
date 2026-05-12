import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { messagesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

const toDto = (m: typeof messagesTable.$inferSelect) => ({
  ...m,
  createdAt: m.createdAt.toISOString(),
  updatedAt: m.updatedAt.toISOString(),
});

router.get("/messages", requireAdmin, async (req, res): Promise<void> => {
  const results = await db.select().from(messagesTable).orderBy(desc(messagesTable.createdAt));
  const { status } = req.query;
  let filtered = results;
  if (status) filtered = filtered.filter(m => m.status === status);
  res.json(filtered.map(toDto));
});

router.post("/messages", async (req, res): Promise<void> => {
  const { name, email, phone, subject, content } = req.body;
  if (!name || !email || !subject || !content) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [msg] = await db.insert(messagesTable).values({ name, email, phone, subject, content }).returning();
  res.status(201).json(toDto(msg));
});

router.get("/messages/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [msg] = await db.select().from(messagesTable).where(eq(messagesTable.id, id));
  if (!msg) { res.status(404).json({ error: "Not found" }); return; }
  res.json(toDto(msg));
});

router.patch("/messages/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [msg] = await db.update(messagesTable).set(req.body).where(eq(messagesTable.id, id)).returning();
  if (!msg) { res.status(404).json({ error: "Not found" }); return; }
  res.json(toDto(msg));
});

router.delete("/messages/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(messagesTable).where(eq(messagesTable.id, id));
  res.sendStatus(204);
});

export default router;
