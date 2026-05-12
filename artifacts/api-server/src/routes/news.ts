import { Router, type IRouter } from "express";
import { Types } from "@workspace/db";
import { News } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();
const isValidId = (id: string) => Types.ObjectId.isValid(id);

router.get("/news", async (req, res): Promise<void> => {
  const filter: Record<string, unknown> = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.featured === "true") filter.featured = true;
  const results = await News.find(filter).sort({ createdAt: -1 });
  res.json(results.map(n => n.toJSON()));
});

router.post("/news", requireAdmin, async (req, res): Promise<void> => {
  const body = { ...req.body, publishedAt: req.body.publishedAt ? new Date(req.body.publishedAt) : null };
  const article = await News.create(body);
  res.status(201).json(article.toJSON());
});

router.get("/news/:id", async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!isValidId(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const article = await News.findById(id);
  if (!article) { res.status(404).json({ error: "Not found" }); return; }
  res.json(article.toJSON());
});

router.patch("/news/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!isValidId(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const body = { ...req.body };
  if (body.publishedAt) body.publishedAt = new Date(body.publishedAt);
  const article = await News.findByIdAndUpdate(id, body, { new: true });
  if (!article) { res.status(404).json({ error: "Not found" }); return; }
  res.json(article.toJSON());
});

router.delete("/news/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!isValidId(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await News.findByIdAndDelete(id);
  res.sendStatus(204);
});

export default router;
