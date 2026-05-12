import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { projectsTable, brokersTable, messagesTable, usersTable, jobsTable } from "@workspace/db";
import { sql, eq, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/stats/dashboard", async (_req, res): Promise<void> => {
  const [totalProjects] = await db.select({ count: count() }).from(projectsTable);
  const [totalBrokers] = await db.select({ count: count() }).from(brokersTable);
  const [totalMessages] = await db.select({ count: count() }).from(messagesTable);
  const [totalEmployees] = await db.select({ count: count() }).from(usersTable);
  const [totalJobs] = await db.select({ count: count() }).from(jobsTable);
  const [newMessages] = await db.select({ count: count() }).from(messagesTable).where(eq(messagesTable.status, "unread"));
  const [featuredProjects] = await db.select({ count: count() }).from(projectsTable).where(eq(projectsTable.featured, true));
  const [activeJobs] = await db.select({ count: count() }).from(jobsTable).where(eq(jobsTable.active, true));

  res.json({
    totalProjects: totalProjects.count,
    totalBrokers: totalBrokers.count,
    totalMessages: totalMessages.count,
    totalEmployees: totalEmployees.count,
    totalJobs: totalJobs.count,
    newMessages: newMessages.count,
    featuredProjects: featuredProjects.count,
    activeJobs: activeJobs.count,
  });
});

router.get("/stats/projects", async (_req, res): Promise<void> => {
  const byStatus = await db
    .select({ status: projectsTable.status, count: count() })
    .from(projectsTable)
    .groupBy(projectsTable.status);

  const byType = await db
    .select({ type: projectsTable.type, count: count() })
    .from(projectsTable)
    .groupBy(projectsTable.type);

  res.json({
    byStatus: byStatus.map(r => ({ status: r.status, count: r.count })),
    byType: byType.map(r => ({ type: r.type || "unknown", count: r.count })),
  });
});

export default router;
