import { Router, type IRouter } from "express";
import { Page } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/pages", async (_req, res): Promise<void> => {
  const results = await Page.find();
  res.json(results.map(p => p.toJSON()));
});

router.post("/pages", requireAdmin, async (req, res): Promise<void> => {
  const page = await Page.create(req.body);
  res.status(201).json(page.toJSON());
});

router.get("/pages/:slug", async (req, res): Promise<void> => {
  const slug = String(req.params.slug);
  const page = await Page.findOne({ slug });
  if (!page) { res.status(404).json({ error: "Page not found" }); return; }
  res.json(page.toJSON());
});

router.patch("/pages/:slug", requireAdmin, async (req, res): Promise<void> => {
  const slug = String(req.params.slug);
  const page = await Page.findOneAndUpdate({ slug }, req.body, { new: true });
  if (!page) { res.status(404).json({ error: "Page not found" }); return; }
  res.json(page.toJSON());
});

router.delete("/pages/:slug", requireAdmin, async (req, res): Promise<void> => {
  const slug = String(req.params.slug);
  await Page.findOneAndDelete({ slug });
  res.sendStatus(204);
});

export default router;
