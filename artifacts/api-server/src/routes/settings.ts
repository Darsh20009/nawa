import { Router, type IRouter } from "express";
import { SiteSettings } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

const ensureSettings = async () => {
  const existing = await SiteSettings.findOne();
  if (existing) return existing;
  return await SiteSettings.create({});
};

router.get("/settings", async (_req, res): Promise<void> => {
  const settings = await ensureSettings();
  res.json(settings.toJSON());
});

router.patch("/settings", requireAdmin, async (req, res): Promise<void> => {
  const existing = await ensureSettings();
  const updated = await SiteSettings.findByIdAndUpdate(existing._id, req.body, { new: true });
  res.json(updated!.toJSON());
});

export default router;
