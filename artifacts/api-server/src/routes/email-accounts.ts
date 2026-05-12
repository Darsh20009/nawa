import { Router, type IRouter } from "express";
import { Types } from "@workspace/db";
import { User } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

export const NAWA_EMAIL_ACCOUNTS = [
  "ceo@nawainv.sa",
  "cob@nawainv.sa",
  "finance@nawainv.sa",
  "investment@nawainv.sa",
  "marketing@nawainv.sa",
  "support@nawainv.sa",
  "info@nawainv.sa",
];

router.get("/email-accounts", requireAdmin, async (_req, res): Promise<void> => {
  const employees = await User.find({}, { name: 1, nameAr: 1, role: 1, department: 1, active: 1, emailAccount: 1 });
  const employeesDto = employees.map(e => ({
    id: e.id,
    name: e.name,
    nameAr: e.nameAr,
    role: e.role,
    department: e.department,
    active: e.active,
    emailAccount: e.emailAccount,
  }));

  const accounts = NAWA_EMAIL_ACCOUNTS.map(email => ({
    email,
    assignedEmployees: employeesDto.filter(e => e.emailAccount === email),
  }));

  res.json({ accounts, employees: employeesDto });
});

router.patch("/email-accounts/assign", requireAdmin, async (req, res): Promise<void> => {
  const { employeeId, emailAccount } = req.body;
  if (!employeeId) { res.status(400).json({ error: "employeeId is required" }); return; }
  if (!Types.ObjectId.isValid(String(employeeId))) { res.status(400).json({ error: "Invalid employeeId" }); return; }
  if (emailAccount && !NAWA_EMAIL_ACCOUNTS.includes(emailAccount)) {
    res.status(400).json({ error: "Invalid email account" });
    return;
  }

  const emp = await User.findByIdAndUpdate(employeeId, { emailAccount: emailAccount || null }, { new: true });
  if (!emp) { res.status(404).json({ error: "Employee not found" }); return; }
  res.json({ success: true, employee: { id: emp.id, name: emp.name, emailAccount: emp.emailAccount } });
});

router.get("/email-accounts/my", requireAdmin, async (req, res): Promise<void> => {
  const authUser = (req as any).user;
  const emp = await User.findById(authUser.id, { emailAccount: 1 });
  res.json({ emailAccount: emp?.emailAccount || null });
});

export default router;
