import { Router, type IRouter } from "express";
import { Project, Broker, Message, User, Job } from "@workspace/db";

const router: IRouter = Router();

router.get("/stats/dashboard", async (_req, res): Promise<void> => {
  const [
    totalProjects, totalBrokers, totalMessages, totalEmployees, totalJobs,
    newMessages, featuredProjects, activeJobs,
  ] = await Promise.all([
    Project.countDocuments(),
    Broker.countDocuments(),
    Message.countDocuments(),
    User.countDocuments(),
    Job.countDocuments(),
    Message.countDocuments({ status: "unread" }),
    Project.countDocuments({ featured: true }),
    Job.countDocuments({ active: true }),
  ]);

  res.json({
    totalProjects, totalBrokers, totalMessages, totalEmployees, totalJobs,
    newMessages, featuredProjects, activeJobs,
  });
});

router.get("/stats/projects", async (_req, res): Promise<void> => {
  const byStatus = await Project.aggregate<{ _id: string; count: number }>([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const byType = await Project.aggregate<{ _id: string | null; count: number }>([
    { $group: { _id: "$type", count: { $sum: 1 } } },
  ]);

  res.json({
    byStatus: byStatus.map(r => ({ status: r._id, count: r.count })),
    byType: byType.map(r => ({ type: r._id || "unknown", count: r.count })),
  });
});

export default router;
