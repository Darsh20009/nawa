import { Router, type IRouter } from "express";
import { Types } from "@workspace/db";
import { BoardMember } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();
const isValidId = (id: string) => Types.ObjectId.isValid(id);

router.get("/board-members", async (_req, res): Promise<void> => {
  const results = await BoardMember.find().sort({ order: 1 });
  res.json(results.map(m => m.toJSON()));
});

router.post("/board-members", requireAdmin, async (req, res): Promise<void> => {
  const member = await BoardMember.create(req.body);
  res.status(201).json(member.toJSON());
});

router.patch("/board-members/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!isValidId(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const member = await BoardMember.findByIdAndUpdate(id, req.body, { new: true });
  if (!member) { res.status(404).json({ error: "Not found" }); return; }
  res.json(member.toJSON());
});

router.delete("/board-members/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!isValidId(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await BoardMember.findByIdAndDelete(id);
  res.sendStatus(204);
});

export default router;
