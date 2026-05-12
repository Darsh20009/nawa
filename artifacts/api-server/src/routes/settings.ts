import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { siteSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

const toDto = (s: typeof siteSettingsTable.$inferSelect) => ({
  ...s,
  updatedAt: s.updatedAt.toISOString(),
});

const ensureSettings = async () => {
  const [existing] = await db.select().from(siteSettingsTable);
  if (!existing) {
    const [created] = await db.insert(siteSettingsTable).values({}).returning();
    return created;
  }
  return existing;
};

router.get("/settings", async (_req, res): Promise<void> => {
  const settings = await ensureSettings();
  res.json(toDto(settings));
});

router.patch("/settings", requireAdmin, async (req, res): Promise<void> => {
  const existing = await ensureSettings();
  const [updated] = await db
    .update(siteSettingsTable)
    .set(req.body)
    .where(eq(siteSettingsTable.id, existing.id))
    .returning();
  res.json(toDto(updated));
});

export default router;
