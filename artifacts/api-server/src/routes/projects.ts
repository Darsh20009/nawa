import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { projectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/projects", async (req, res): Promise<void> => {
  const { status, featured } = req.query;
  let query = db.select().from(projectsTable);
  const results = await query.orderBy(projectsTable.createdAt);

  let filtered = results;
  if (status) filtered = filtered.filter(p => p.status === status);
  if (featured === "true") filtered = filtered.filter(p => p.featured === true);

  res.json(filtered.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  })));
});

router.post("/projects", requireAdmin, async (req, res): Promise<void> => {
  const body = req.body;
  const [project] = await db.insert(projectsTable).values({
    title: body.title,
    titleAr: body.titleAr,
    description: body.description,
    descriptionAr: body.descriptionAr,
    location: body.location,
    locationAr: body.locationAr,
    status: body.status || "planning",
    type: body.type,
    totalUnits: body.totalUnits,
    availableUnits: body.availableUnits,
    completionPercentage: body.completionPercentage,
    imageUrl: body.imageUrl,
    featured: body.featured ?? false,
    price: body.price,
    area: body.area,
  }).returning();
  res.status(201).json({ ...project, createdAt: project.createdAt.toISOString(), updatedAt: project.updatedAt.toISOString() });
});

router.get("/projects/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  res.json({ ...project, createdAt: project.createdAt.toISOString(), updatedAt: project.updatedAt.toISOString() });
});

router.patch("/projects/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [project] = await db.update(projectsTable).set(req.body).where(eq(projectsTable.id, id)).returning();
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  res.json({ ...project, createdAt: project.createdAt.toISOString(), updatedAt: project.updatedAt.toISOString() });
});

router.delete("/projects/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.delete(projectsTable).where(eq(projectsTable.id, id));
  res.sendStatus(204);
});

export default router;
