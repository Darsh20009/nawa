import { Router, type IRouter } from "express";
import { Types } from "@workspace/db";
import { User } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth";
import { hashPassword } from "../lib/auth";

const router: IRouter = Router();
const isValidId = (id: string) => Types.ObjectId.isValid(id);

const toDto = (u: any) => ({
  id: u.id ?? u._id?.toString(),
  name: u.name,
  nameAr: u.nameAr,
  email: u.email,
  role: u.role,
  department: u.department,
  avatar: u.avatar,
  phone: u.phone,
  active: u.active,
  permissions: u.permissions,
  emailAccount: u.emailAccount,
  createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
});

router.get("/employees", requireAdmin, async (_req, res): Promise<void> => {
  const results = await User.find();
  res.json(results.map(toDto));
});

router.post("/employees", requireAdmin, async (req, res): Promise<void> => {
  const { password, ...rest } = req.body;
  if (!password) { res.status(400).json({ error: "Password required" }); return; }
  const hashed = await hashPassword(password);
  const employee = await User.create({ ...rest, password: hashed });
  res.status(201).json(toDto(employee));
});

router.get("/employees/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!isValidId(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const emp = await User.findById(id);
  if (!emp) { res.status(404).json({ error: "Not found" }); return; }
  res.json(toDto(emp));
});

router.patch("/employees/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!isValidId(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { password, ...rest } = req.body;
  const updateData: Record<string, unknown> = { ...rest };
  if (password) updateData.password = await hashPassword(password);
  const emp = await User.findByIdAndUpdate(id, updateData, { new: true });
  if (!emp) { res.status(404).json({ error: "Not found" }); return; }
  res.json(toDto(emp));
});

router.delete("/employees/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!isValidId(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await User.findByIdAndDelete(id);
  res.sendStatus(204);
});

export default router;
