import { Router, type IRouter } from "express";
import { Types } from "@workspace/db";
import { Project } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

const isValidId = (id: string) => Types.ObjectId.isValid(id);

router.get("/projects", async (req, res): Promise<void> => {
  const { status, featured } = req.query;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (featured === "true") filter.featured = true;
  const results = await Project.find(filter).sort({ createdAt: 1 });
  res.json(results.map(p => p.toJSON()));
});

router.post("/projects", requireAdmin, async (req, res): Promise<void> => {
  const project = await Project.create(req.body);
  res.status(201).json(project.toJSON());
});

router.get("/projects/:id", async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!isValidId(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const project = await Project.findById(id);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  res.json(project.toJSON());
});

router.patch("/projects/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!isValidId(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const project = await Project.findByIdAndUpdate(id, req.body, { new: true });
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  res.json(project.toJSON());
});

router.delete("/projects/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!isValidId(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await Project.findByIdAndDelete(id);
  res.sendStatus(204);
});

export default router;
