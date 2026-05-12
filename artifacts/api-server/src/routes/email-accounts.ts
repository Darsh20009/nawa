import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

export const NAWA_EMAIL_ACCOUNTS = [
  "ceo@nawainv.sa",
  "cob@nawainv.sa",
  "finance@nawainv.sa",
  "investment@nawainv.sa",
  "marketing@nawainv.sa",
  "support@nawainv.sa",
  "Info@nawainv.sa",
];

router.get("/email-accounts", requireAdmin, async (_req, res): Promise<void> => {
  const employees = await db.select({
    id: usersTable.id,
    name: usersTable.name,
    nameAr: usersTable.nameAr,
    role: usersTable.role,
    department: usersTable.department,
    active: usersTable.active,
    emailAccount: usersTable.emailAccount,
  }).from(usersTable);

  const assignedAccounts = employees
    .filter(e => e.emailAccount)
    .map(e => e.emailAccount as string);

  const accounts = NAWA_EMAIL_ACCOUNTS.map(email => ({
    email,
    assignedTo: employees.find(e => e.emailAccount === email) || null,
    isAvailable: !assignedAccounts.includes(email),
  }));

  res.json({ accounts, employees });
});

router.patch("/email-accounts/assign", requireAdmin, async (req, res): Promise<void> => {
  const { employeeId, emailAccount } = req.body;

  if (!employeeId) {
    res.status(400).json({ error: "employeeId is required" });
    return;
  }

  if (emailAccount && !NAWA_EMAIL_ACCOUNTS.includes(emailAccount)) {
    res.status(400).json({ error: "Invalid email account" });
    return;
  }

  const [emp] = await db
    .update(usersTable)
    .set({ emailAccount: emailAccount || null })
    .where(eq(usersTable.id, employeeId))
    .returning();

  if (!emp) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }

  res.json({ success: true, employee: { id: emp.id, name: emp.name, emailAccount: emp.emailAccount } });
});

router.get("/email-accounts/my", async (req, res): Promise<void> => {
  const authUser = (req as any).user;
  if (!authUser) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [emp] = await db.select({ emailAccount: usersTable.emailAccount }).from(usersTable).where(eq(usersTable.id, authUser.id));
  res.json({ emailAccount: emp?.emailAccount || null });
});

export default router;
