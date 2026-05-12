import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { boardMembersTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

const toDto = (m: typeof boardMembersTable.$inferSelect) => ({
  ...m,
  createdAt: m.createdAt.toISOString(),
  updatedAt: m.updatedAt.toISOString(),
});

router.get("/board-members", async (_req, res): Promise<void> => {
  const results = await db.select().from(boardMembersTable).orderBy(asc(boardMembersTable.order));
  res.json(results.map(toDto));
});

router.post("/board-members", requireAdmin, async (req, res): Promise<void> => {
  const [member] = await db.insert(boardMembersTable).values(req.body).returning();
  res.status(201).json(toDto(member));
});

router.patch("/board-members/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [member] = await db.update(boardMembersTable).set(req.body).where(eq(boardMembersTable.id, id)).returning();
  if (!member) { res.status(404).json({ error: "Not found" }); return; }
  res.json(toDto(member));
});

router.delete("/board-members/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(boardMembersTable).where(eq(boardMembersTable.id, id));
  res.sendStatus(204);
});

export default router;
