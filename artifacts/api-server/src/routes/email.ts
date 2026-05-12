import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";
import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const IMAP_HOST = process.env.IMAP_HOST || "server222.web-hosting.com";
const IMAP_PORT = Number(process.env.IMAP_PORT || 993);
const SMTP_HOST = process.env.SMTP_HOST || "server222.web-hosting.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const EMAIL_PASSWORD = process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD || "";

if (!EMAIL_PASSWORD) {
  logger.warn("SMTP_PASSWORD not set — email send/receive will fail until configured");
}

const NAWA_EMAIL_ACCOUNTS = [
  "ceo@nawainv.sa",
  "cob@nawainv.sa",
  "finance@nawainv.sa",
  "investment@nawainv.sa",
  "marketing@nawainv.sa",
  "support@nawainv.sa",
  "info@nawainv.sa",
];

function getTransporter(fromEmail: string) {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: true,
    auth: { user: fromEmail, pass: EMAIL_PASSWORD },
    tls: { rejectUnauthorized: false },
  });
}

function getImapClient(email: string) {
  return new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    secure: true,
    auth: { user: email, pass: EMAIL_PASSWORD },
    tls: { rejectUnauthorized: false },
    logger: false,
  });
}

function parseUid(param: string | string[]): number {
  const s = Array.isArray(param) ? param[0] : param;
  return parseInt(s, 10);
}

function toISOSafe(d: Date | string | undefined): string {
  if (!d) return new Date().toISOString();
  if (typeof d === "string") return d;
  return d.toISOString();
}

function isAdmin(user: any): boolean {
  return user?.role === "super_admin" || user?.role === "admin";
}

async function resolveEmailAccount(user: any, asAccount?: string): Promise<string | null> {
  if (asAccount && isAdmin(user) && NAWA_EMAIL_ACCOUNTS.includes(asAccount)) {
    return asAccount;
  }
  const [row] = await db.select({ emailAccount: usersTable.emailAccount }).from(usersTable).where(eq(usersTable.id, user.id));
  return row?.emailAccount || null;
}

router.get("/email/accounts-list", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as any).user;
  const [row] = await db.select({ emailAccount: usersTable.emailAccount }).from(usersTable).where(eq(usersTable.id, authUser.id));
  res.json({
    assignedAccount: row?.emailAccount || null,
    isAdmin: isAdmin(authUser),
    allAccounts: isAdmin(authUser) ? NAWA_EMAIL_ACCOUNTS : [],
  });
});

router.get("/email/inbox", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as any).user;
  const asAccount = req.query.asAccount as string | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const folder = (req.query.folder as string) || "INBOX";

  const effectiveEmail = await resolveEmailAccount(authUser, asAccount);
  if (!effectiveEmail) {
    res.status(400).json({ error: "no_email_assigned", message: "لم يتم تعيين حساب بريد إلكتروني لك. يرجى التواصل مع مسؤول النظام." });
    return;
  }

  const client = getImapClient(effectiveEmail);
  try {
    await client.connect();
    const lock = await client.getMailboxLock(folder);
    try {
      const mailbox = client.mailbox as any;
      const total = mailbox?.exists ?? 0;
      const start = Math.max(1, total - (page - 1) * limit - limit + 1);
      const end = Math.max(1, total - (page - 1) * limit);

      if (total === 0) {
        res.json({ messages: [], total: 0, page, limit, account: effectiveEmail });
        return;
      }

      const messages: any[] = [];
      for await (const msg of client.fetch(
        `${start}:${end}`,
        { uid: true, flags: true, envelope: true, bodyStructure: true, internalDate: true },
      )) {
        messages.push({
          uid: msg.uid,
          seq: msg.seq,
          subject: msg.envelope?.subject || "(بدون موضوع)",
          from: msg.envelope?.from?.[0] ? `${msg.envelope.from[0].name || ""} <${msg.envelope.from[0].address}>`.trim() : "Unknown",
          to: msg.envelope?.to?.map((t: any) => t.address).join(", ") || "",
          date: toISOSafe(msg.internalDate),
          seen: msg.flags?.has("\\Seen") ?? false,
          flagged: msg.flags?.has("\\Flagged") ?? false,
          hasAttachment: (msg.bodyStructure as any)?.childNodes?.some((n: any) => n.disposition === "attachment") ?? false,
        });
      }

      messages.reverse();
      res.json({ messages, total, page, limit, account: effectiveEmail });
    } finally {
      lock.release();
      await client.logout();
    }
  } catch (err: any) {
    logger.error({ err: err.message }, "IMAP inbox error");
    await client.close();
    res.status(500).json({ error: "Failed to connect to email server", detail: err.message });
  }
});

router.get("/email/message/:uid", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as any).user;
  const asAccount = req.query.asAccount as string | undefined;
  const uid = parseUid(req.params["uid"]);
  const folder = (req.query.folder as string) || "INBOX";

  const effectiveEmail = await resolveEmailAccount(authUser, asAccount);
  if (!effectiveEmail) {
    res.status(400).json({ error: "no_email_assigned" });
    return;
  }

  const client = getImapClient(effectiveEmail);
  try {
    await client.connect();
    const lock = await client.getMailboxLock(folder);
    try {
      let found: any = null;
      for await (const msg of client.fetch(
        uid.toString(),
        { uid: true, flags: true, envelope: true, source: true },
        { uid: true },
      )) {
        const source = msg.source?.toString() || "";
        found = {
          uid: msg.uid,
          subject: msg.envelope?.subject || "(بدون موضوع)",
          from: msg.envelope?.from?.[0] ? `${msg.envelope.from[0].name || ""} <${msg.envelope.from[0].address}>`.trim() : "Unknown",
          to: msg.envelope?.to?.map((t: any) => `${t.name || ""} <${t.address}>`).join(", ") || "",
          date: toISOSafe(msg.envelope?.date),
          seen: msg.flags?.has("\\Seen") ?? false,
          source,
        };
      }
      await client.messageFlagsAdd(uid.toString(), ["\\Seen"], { uid: true });
      if (!found) {
        res.status(404).json({ error: "Message not found" });
        return;
      }
      res.json(found);
    } finally {
      lock.release();
      await client.logout();
    }
  } catch (err: any) {
    logger.error({ err: err.message }, "IMAP message fetch error");
    await client.close();
    res.status(500).json({ error: "Failed to fetch message" });
  }
});

router.get("/email/folders", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as any).user;
  const asAccount = req.query.asAccount as string | undefined;

  const effectiveEmail = await resolveEmailAccount(authUser, asAccount);
  if (!effectiveEmail) {
    res.status(400).json({ error: "no_email_assigned" });
    return;
  }

  const client = getImapClient(effectiveEmail);
  try {
    await client.connect();
    const list = await client.list();
    const folders = list.map((f: any) => ({
      name: f.name,
      path: f.path,
      delimiter: f.delimiter,
    }));
    await client.logout();
    res.json(folders);
  } catch (err: any) {
    logger.error({ err: err.message }, "IMAP folders error");
    await client.close();
    res.status(500).json({ error: "Failed to list folders" });
  }
});

router.post("/email/send", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as any).user;
  const { to, subject, body, cc, bcc, replyTo, asAccount } = req.body;

  if (!to || !subject || !body) {
    res.status(400).json({ error: "to, subject, and body are required" });
    return;
  }

  const fromEmail = await resolveEmailAccount(authUser, asAccount);
  if (!fromEmail) {
    res.status(400).json({ error: "no_email_assigned", message: "لم يتم تعيين حساب بريد إلكتروني لك." });
    return;
  }

  try {
    const transporter = getTransporter(fromEmail);
    const mailOptions: any = {
      from: `${authUser.name || "نوى العقارية"} <${fromEmail}>`,
      to,
      subject,
      html: body,
      text: body.replace(/<[^>]*>/g, ""),
    };
    if (cc) mailOptions.cc = cc;
    if (bcc) mailOptions.bcc = bcc;
    if (replyTo) mailOptions.replyTo = replyTo;

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Email sent successfully", from: fromEmail });
  } catch (err: any) {
    logger.error({ err: err.message }, "SMTP send error");
    res.status(500).json({ error: "Failed to send email", detail: err.message });
  }
});

router.delete("/email/message/:uid", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as any).user;
  const asAccount = req.query.asAccount as string | undefined;
  const uid = parseUid(req.params["uid"]);
  const folder = (req.query.folder as string) || "INBOX";

  const effectiveEmail = await resolveEmailAccount(authUser, asAccount);
  if (!effectiveEmail) { res.status(400).json({ error: "no_email_assigned" }); return; }

  const client = getImapClient(effectiveEmail);
  try {
    await client.connect();
    const lock = await client.getMailboxLock(folder);
    try {
      await client.messageDelete(uid.toString(), { uid: true });
      res.json({ success: true });
    } finally {
      lock.release();
      await client.logout();
    }
  } catch (err: any) {
    logger.error({ err: err.message }, "IMAP delete error");
    await client.close();
    res.status(500).json({ error: "Failed to delete message" });
  }
});

router.post("/email/flag/:uid", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as any).user;
  const uid = parseUid(req.params["uid"]);
  const { folder = "INBOX", flag = "\\Flagged", add = true, asAccount } = req.body;

  const effectiveEmail = await resolveEmailAccount(authUser, asAccount);
  if (!effectiveEmail) { res.status(400).json({ error: "no_email_assigned" }); return; }

  const client = getImapClient(effectiveEmail);
  try {
    await client.connect();
    const lock = await client.getMailboxLock(folder);
    try {
      if (add) {
        await client.messageFlagsAdd(uid.toString(), [flag], { uid: true });
      } else {
        await client.messageFlagsRemove(uid.toString(), [flag], { uid: true });
      }
      res.json({ success: true });
    } finally {
      lock.release();
      await client.logout();
    }
  } catch (err: any) {
    logger.error({ err: err.message }, "IMAP flag error");
    await client.close();
    res.status(500).json({ error: "Failed to update flag" });
  }
});

export default router;
