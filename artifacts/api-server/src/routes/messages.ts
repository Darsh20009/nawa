import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { messagesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import { sendNawaMail, wrapNawaEmailHtml } from "../lib/mailer";
import { generateAiText } from "./ai";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const toDto = (m: typeof messagesTable.$inferSelect) => ({
  ...m,
  createdAt: m.createdAt.toISOString(),
  updatedAt: m.updatedAt.toISOString(),
});

router.get("/messages", requireAdmin, async (req, res): Promise<void> => {
  const results = await db.select().from(messagesTable).orderBy(desc(messagesTable.createdAt));
  const { status } = req.query;
  let filtered = results;
  if (status) filtered = filtered.filter(m => m.status === status);
  res.json(filtered.map(toDto));
});

router.post("/messages", async (req, res): Promise<void> => {
  const { name, email, phone, subject, content } = req.body;
  if (!name || !email || !subject || !content) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [msg] = await db.insert(messagesTable).values({ name, email, phone, subject, content }).returning();
  res.status(201).json(toDto(msg));

  // Fire-and-forget AI-powered notifications
  (async () => {
    try {
      // 1) AI-personalized confirmation to the client
      const replyBody = await generateAiText(
        `اكتب رد ترحيبي قصير ودافئ واحترافي (3-5 جمل، عربي فقط، بدون markdown) لعميل أرسل لنا الرسالة التالية إلى نوى العقارية. لا تذكر أنك ذكاء اصطناعي. أكد له أن فريقنا سيتواصل معه قريباً.\n\nالموضوع: ${subject}\nالرسالة: ${content}`,
        "أنت موظف خدمة عملاء في نوى العقارية. ردودك مختصرة، احترافية، ودافئة.",
        300,
      );
      const safeReply = replyBody?.trim() || `شكراً لتواصلك مع نوى العقارية يا ${name}. استلمنا رسالتك بخصوص "${subject}" وسيتواصل معك أحد ممثلينا في أقرب وقت.`;

      await sendNawaMail({
        from: "info@nawainv.sa",
        to: email,
        subject: `شكراً لتواصلك مع نوى العقارية`,
        html: wrapNawaEmailHtml({
          title: `أهلاً ${name}`,
          lang: "ar",
          bodyHtml: `<p>${safeReply.replace(/\n/g, "<br/>")}</p>
            <p style="margin-top:18px;color:#666;font-size:13px;">رقم المرجع: <b>#${msg.id}</b></p>`,
        }),
      });

      // 2) Internal notification to admin inbox
      await sendNawaMail({
        from: "info@nawainv.sa",
        to: "info@nawainv.sa",
        subject: `📩 رسالة جديدة من ${name} — ${subject}`,
        html: wrapNawaEmailHtml({
          title: "رسالة جديدة عبر الموقع",
          lang: "ar",
          bodyHtml: `
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="padding:6px 0;color:#888;width:90px;">الاسم:</td><td style="padding:6px 0;"><b>${name}</b></td></tr>
              <tr><td style="padding:6px 0;color:#888;">البريد:</td><td style="padding:6px 0;">${email}</td></tr>
              ${phone ? `<tr><td style="padding:6px 0;color:#888;">الجوال:</td><td style="padding:6px 0;">${phone}</td></tr>` : ""}
              <tr><td style="padding:6px 0;color:#888;">الموضوع:</td><td style="padding:6px 0;"><b>${subject}</b></td></tr>
            </table>
            <hr style="border:none;border-top:1px solid #eee;margin:14px 0;"/>
            <p style="white-space:pre-wrap;">${content}</p>
            <p style="margin-top:18px;color:#888;font-size:12px;">مرجع: #${msg.id}</p>`,
          }),
        replyTo: email,
      });
    } catch (err) {
      logger.warn({ err, msgId: msg.id }, "Email notifications failed (non-blocking)");
    }
  })();
});

router.get("/messages/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [msg] = await db.select().from(messagesTable).where(eq(messagesTable.id, id));
  if (!msg) { res.status(404).json({ error: "Not found" }); return; }
  res.json(toDto(msg));
});

router.patch("/messages/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [msg] = await db.update(messagesTable).set(req.body).where(eq(messagesTable.id, id)).returning();
  if (!msg) { res.status(404).json({ error: "Not found" }); return; }
  res.json(toDto(msg));
});

router.delete("/messages/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(messagesTable).where(eq(messagesTable.id, id));
  res.sendStatus(204);
});

export default router;
