import { Router, type IRouter } from "express";
import { Types } from "@workspace/db";
import { Broker } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();
const isValidId = (id: string) => Types.ObjectId.isValid(id);

router.get("/brokers", async (_req, res): Promise<void> => {
  const results = await Broker.find();
  res.json(results.map(b => b.toJSON()));
});

router.post("/brokers", requireAdmin, async (req, res): Promise<void> => {
  const broker = await Broker.create(req.body);
  res.status(201).json(broker.toJSON());
});

router.patch("/brokers/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!isValidId(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const broker = await Broker.findByIdAndUpdate(id, req.body, { new: true });
  if (!broker) { res.status(404).json({ error: "Not found" }); return; }
  res.json(broker.toJSON());
});

router.delete("/brokers/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!isValidId(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await Broker.findByIdAndDelete(id);
  res.sendStatus(204);
});

export default router;
