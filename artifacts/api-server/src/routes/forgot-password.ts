import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, passwordResetsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { hashPassword } from "../lib/auth";
import { logger } from "../lib/logger";
import nodemailer from "nodemailer";
import crypto from "crypto";

const router: IRouter = Router();

const SMTP_HOST = "server222.web-hosting.com";
const SMTP_PORT = 465;
const SMTP_USER = "ceo@nawainv.sa";
const SMTP_PASS = "ASDfgh@12345678nawa";

function getTransporter() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: { rejectUnauthorized: false },
  });
}

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));

  if (!user) {
    res.json({ success: true, message: "If that email exists, you will receive a reset link" });
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

  await db.insert(passwordResetsTable).values({ email: user.email, token, expiresAt });

  const resetUrl = `${process.env.APP_URL || "https://nawainv.sa"}/auth/reset-password?token=${token}`;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"نوى العقارية" <${SMTP_USER}>`,
      to: user.email,
      subject: "إعادة تعيين كلمة المرور — نوى العقارية",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
          <div style="background: #0D1B3E; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #C9A96E; margin: 0; font-size: 24px;">نوى العقارية</h1>
          </div>
          <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px;">
            <h2 style="color: #0D1B3E; margin-top: 0;">إعادة تعيين كلمة المرور</h2>
            <p style="color: #555; line-height: 1.8;">مرحباً ${user.nameAr || user.name}،</p>
            <p style="color: #555; line-height: 1.8;">تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك. انقر على الزر أدناه للمتابعة:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #0D1B3E; color: #C9A96E; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                إعادة تعيين كلمة المرور
              </a>
            </div>
            <p style="color: #888; font-size: 14px;">هذا الرابط صالح لمدة ساعة واحدة فقط.</p>
            <p style="color: #888; font-size: 14px;">إذا لم تطلب إعادة تعيين كلمة المرور، تجاهل هذا البريد الإلكتروني.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="color: #aaa; font-size: 12px; text-align: center;">نوى العقارية — nawainv.sa</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    logger.error({ err }, "Failed to send password reset email");
  }

  res.json({ success: true, message: "If that email exists, you will receive a reset link" });
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const { token, password } = req.body;
  if (!token || !password) {
    res.status(400).json({ error: "Token and password are required" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const [reset] = await db
    .select()
    .from(passwordResetsTable)
    .where(
      and(
        eq(passwordResetsTable.token, token),
        eq(passwordResetsTable.used, false),
        gt(passwordResetsTable.expiresAt, new Date()),
      ),
    );

  if (!reset) {
    res.status(400).json({ error: "Invalid or expired reset token" });
    return;
  }

  const hashed = await hashPassword(password);
  await db.update(usersTable).set({ password: hashed }).where(eq(usersTable.email, reset.email));
  await db.update(passwordResetsTable).set({ used: true }).where(eq(passwordResetsTable.id, reset.id));

  res.json({ success: true, message: "Password reset successfully" });
});

export default router;
