import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "./logger";

const SMTP_HOST = process.env.SMTP_HOST || "server222.web-hosting.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const EMAIL_PASSWORD = process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD || "";

export const NAWA_EMAIL_ACCOUNTS = [
  "ceo@nawainv.sa",
  "cob@nawainv.sa",
  "finance@nawainv.sa",
  "investment@nawainv.sa",
  "marketing@nawainv.sa",
  "support@nawainv.sa",
  "info@nawainv.sa",
] as const;

export type NawaEmailAccount = (typeof NAWA_EMAIL_ACCOUNTS)[number];

const transporters = new Map<string, Transporter>();

export function getTransporter(fromEmail: string): Transporter {
  const existing = transporters.get(fromEmail);
  if (existing) return existing;
  const t = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: true,
    auth: { user: fromEmail, pass: EMAIL_PASSWORD },
    tls: { rejectUnauthorized: false },
    pool: true,
    maxConnections: 3,
  });
  transporters.set(fromEmail, t);
  return t;
}

export interface SendNawaMailOptions {
  from?: NawaEmailAccount;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
}

const NAWA_NAVY = "#0D1B3E";
const NAWA_GOLD = "#C9A96E";

export function wrapNawaEmailHtml(opts: { title?: string; bodyHtml: string; lang?: "ar" | "en" }): string {
  const dir = opts.lang === "en" ? "ltr" : "rtl";
  const align = dir === "rtl" ? "right" : "left";
  return `<!doctype html>
<html dir="${dir}" lang="${opts.lang || "ar"}">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Tajawal',Tahoma,Arial,sans-serif;direction:${dir};text-align:${align};color:#222;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 6px 24px rgba(13,27,62,0.08);">
        <tr><td style="background:${NAWA_NAVY};padding:22px 28px;text-align:center;">
          <div style="display:inline-block;border-bottom:2px solid ${NAWA_GOLD};padding-bottom:6px;">
            <span style="color:#fff;font-size:22px;font-weight:700;letter-spacing:0.5px;">نوى العقارية</span>
            <span style="color:${NAWA_GOLD};font-size:13px;display:block;margin-top:2px;">NAWA REAL ESTATE</span>
          </div>
        </td></tr>
        ${opts.title ? `<tr><td style="padding:24px 28px 0;"><h1 style="margin:0;color:${NAWA_NAVY};font-size:20px;">${opts.title}</h1></td></tr>` : ""}
        <tr><td style="padding:20px 28px 32px;font-size:15px;line-height:1.85;color:#333;">${opts.bodyHtml}</td></tr>
        <tr><td style="background:#fafafa;border-top:1px solid #eee;padding:18px 28px;text-align:center;font-size:12px;color:#888;">
          <div style="margin-bottom:6px;">
            <a href="https://nawainv.sa" style="color:${NAWA_NAVY};text-decoration:none;font-weight:600;">nawainv.sa</a>
            &nbsp;·&nbsp; +966 50 007 3509
            &nbsp;·&nbsp; <a href="mailto:info@nawainv.sa" style="color:${NAWA_NAVY};text-decoration:none;">info@nawainv.sa</a>
          </div>
          <div style="color:#aaa;">© ${new Date().getFullYear()} نوى العقارية · جميع الحقوق محفوظة</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function sendNawaMail(opts: SendNawaMailOptions): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  if (!EMAIL_PASSWORD) {
    return { ok: false, error: "SMTP_PASSWORD not configured" };
  }
  const from = opts.from || "info@nawainv.sa";
  try {
    const t = getTransporter(from);
    const info = await t.sendMail({
      from: `"نوى العقارية" <${from}>`,
      to: Array.isArray(opts.to) ? opts.to.join(", ") : opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      replyTo: opts.replyTo,
    });
    logger.info({ from, to: opts.to, messageId: info.messageId }, "Email sent");
    return { ok: true, messageId: info.messageId };
  } catch (err: any) {
    logger.error({ err, from, to: opts.to }, "Failed to send email");
    return { ok: false, error: err?.message || "send failed" };
  }
}
