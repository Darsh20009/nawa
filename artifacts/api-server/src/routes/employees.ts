import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import { hashPassword } from "../lib/auth";

const router: IRouter = Router();

const toDto = (u: typeof usersTable.$inferSelect) => ({
  id: u.id,
  name: u.name,
  nameAr: u.nameAr,
  email: u.email,
  role: u.role,
  department: u.department,
  avatar: u.avatar,
  phone: u.phone,
  active: u.active,
  permissions: u.permissions,
  createdAt: u.createdAt.toISOString(),
});

router.get("/employees", requireAdmin, async (_req, res): Promise<void> => {
  const results = await db.select().from(usersTable);
  res.json(results.map(toDto));
});

router.post("/employees", requireAdmin, async (req, res): Promise<void> => {
  const { password, ...rest } = req.body;
  if (!password) { res.status(400).json({ error: "Password required" }); return; }
  const hashed = await hashPassword(password);
  const [employee] = await db.insert(usersTable).values({ ...rest, password: hashed }).returning();
  res.status(201).json(toDto(employee));
});

router.get("/employees/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [emp] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!emp) { res.status(404).json({ error: "Not found" }); return; }
  res.json(toDto(emp));
});

router.patch("/employees/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { password, ...rest } = req.body;
  const updateData: Record<string, unknown> = { ...rest };
  if (password) updateData.password = await hashPassword(password);
  const [emp] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, id)).returning();
  if (!emp) { res.status(404).json({ error: "Not found" }); return; }
  res.json(toDto(emp));
});

router.delete("/employees/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.sendStatus(204);
});

export default router;
