import { Router, type IRouter } from "express";
import { Types } from "@workspace/db";
import { Service } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();
const isValidId = (id: string) => Types.ObjectId.isValid(id);

router.get("/services", async (_req, res): Promise<void> => {
  const results = await Service.find().sort({ order: 1 });
  res.json(results.map(s => s.toJSON()));
});

router.post("/services", requireAdmin, async (req, res): Promise<void> => {
  const service = await Service.create(req.body);
  res.status(201).json(service.toJSON());
});

router.patch("/services/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!isValidId(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const service = await Service.findByIdAndUpdate(id, req.body, { new: true });
  if (!service) { res.status(404).json({ error: "Service not found" }); return; }
  res.json(service.toJSON());
});

router.delete("/services/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!isValidId(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await Service.findByIdAndDelete(id);
  res.sendStatus(204);
});

export default router;
