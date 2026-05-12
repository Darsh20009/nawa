import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";
import { db } from "@workspace/db";
import { newsTable, jobsTable, messagesTable, projectsTable, brokersTable, usersTable } from "@workspace/db";
import { count, desc, eq } from "drizzle-orm";
import { sendNawaMail, wrapNawaEmailHtml, NAWA_EMAIL_ACCOUNTS } from "../lib/mailer";

const router: IRouter = Router();

const KIMI_API_KEY = process.env.KIMI_API_KEY || "";
const KIMI_BASE_URL = "https://api.moonshot.ai/v1";
const KIMI_MODEL = "kimi-k2.6";

function isAdmin(user: any): boolean {
  return user?.role === "super_admin" || user?.role === "admin";
}

// =====================================================================
// Agent Tools — actions Nawa AI can perform
// =====================================================================
const AGENT_TOOLS = [
  {
    type: "function",
    function: {
      name: "publish_news",
      description: "Publish a news article or press release to the Nawa Real Estate website. Admin only. Returns the created article id.",
      parameters: {
        type: "object",
        properties: {
          titleAr: { type: "string", description: "Arabic title" },
          title: { type: "string", description: "English title" },
          contentAr: { type: "string", description: "Arabic body content" },
          content: { type: "string", description: "English body content" },
          category: { type: "string", enum: ["news", "announcement", "press-release", "event"], description: "Article category" },
          featured: { type: "boolean", description: "Pin to homepage" },
        },
        required: ["titleAr", "title", "contentAr"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "publish_job",
      description: "Publish a new job posting to the Nawa careers page. Admin only.",
      parameters: {
        type: "object",
        properties: {
          titleAr: { type: "string" },
          title: { type: "string" },
          departmentAr: { type: "string" },
          department: { type: "string" },
          descriptionAr: { type: "string" },
          description: { type: "string" },
          requirementsAr: { type: "string" },
          requirements: { type: "string" },
          type: { type: "string", enum: ["full-time", "part-time", "contract", "internship"] },
          location: { type: "string" },
        },
        required: ["titleAr", "title", "departmentAr", "department"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_email",
      description: "Send an email to a client or external recipient via the staff member's assigned Nawa email account (or info@nawainv.sa). The email is automatically wrapped in Nawa-branded HTML.",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "Recipient email address" },
          subject: { type: "string" },
          bodyHtml: { type: "string", description: "Body in HTML (or plain text)" },
          fromAccount: { type: "string", enum: NAWA_EMAIL_ACCOUNTS as unknown as string[], description: "Optional: override sender account (admin only)" },
          language: { type: "string", enum: ["ar", "en"] },
          title: { type: "string", description: "Optional headline shown above the body" },
        },
        required: ["to", "subject", "bodyHtml"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "review_pending_tasks",
      description: "Review pending work items: unread contact messages, new job applications, recent inquiries. Read-only.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max items per category (default 5)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_dashboard_stats",
      description: "Get current platform statistics: project count, brokers, employees, unread messages, active jobs. Read-only.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "draft_project_description",
      description: "Generate a polished Arabic+English description for a real estate project (does NOT publish — returns text only).",
      parameters: {
        type: "object",
        properties: {
          projectName: { type: "string" },
          location: { type: "string" },
          type: { type: "string" },
          features: { type: "array", items: { type: "string" } },
        },
        required: ["projectName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyze_market",
      description: "Provide Saudi real estate market analysis (text only).",
      parameters: {
        type: "object",
        properties: {
          region: { type: "string" },
          segment: { type: "string", enum: ["residential", "commercial", "industrial", "hospitality"] },
        },
        required: ["region"],
      },
    },
  },
];

// =====================================================================
// Tool executor — runs the actual side effects
// =====================================================================
async function executeTool(toolName: string, args: any, authUser: any): Promise<{ ok: boolean; result?: any; error?: string }> {
  try {
    switch (toolName) {
      case "publish_news": {
        if (!isAdmin(authUser)) return { ok: false, error: "صلاحية النشر مطلوبة (admin)" };
        const [row] = await db.insert(newsTable).values({
          title: args.title,
          titleAr: args.titleAr,
          content: args.content || args.contentAr,
          contentAr: args.contentAr,
          category: args.category || "news",
          featured: !!args.featured,
          publishedAt: new Date(),
        }).returning();
        return { ok: true, result: { id: row.id, title: row.titleAr, kind: "news" } };
      }
      case "publish_job": {
        if (!isAdmin(authUser)) return { ok: false, error: "صلاحية النشر مطلوبة (admin)" };
        const [row] = await db.insert(jobsTable).values({
          title: args.title,
          titleAr: args.titleAr,
          department: args.department,
          departmentAr: args.departmentAr,
          description: args.description,
          descriptionAr: args.descriptionAr,
          requirements: args.requirements,
          requirementsAr: args.requirementsAr,
          type: args.type || "full-time",
          location: args.location || "الرياض",
          active: true,
        }).returning();
        return { ok: true, result: { id: row.id, title: row.titleAr, kind: "job" } };
      }
      case "send_email": {
        let from: any = "info@nawainv.sa";
        if (args.fromAccount && isAdmin(authUser) && (NAWA_EMAIL_ACCOUNTS as readonly string[]).includes(args.fromAccount)) {
          from = args.fromAccount;
        } else {
          const [u] = await db.select({ emailAccount: usersTable.emailAccount }).from(usersTable).where(eq(usersTable.id, authUser.id));
          if (u?.emailAccount && (NAWA_EMAIL_ACCOUNTS as readonly string[]).includes(u.emailAccount)) from = u.emailAccount;
        }
        const html = wrapNawaEmailHtml({ title: args.title, bodyHtml: args.bodyHtml, lang: args.language || "ar" });
        const r = await sendNawaMail({ from, to: args.to, subject: args.subject, html });
        if (!r.ok) return { ok: false, error: r.error };
        return { ok: true, result: { sent: true, from, to: args.to, messageId: r.messageId } };
      }
      case "review_pending_tasks": {
        const limit = Math.min(Number(args.limit) || 5, 20);
        const [unread] = await db.select({ c: count() }).from(messagesTable).where(eq(messagesTable.status, "unread"));
        const recentMsgs = await db.select().from(messagesTable).orderBy(desc(messagesTable.createdAt)).limit(limit);
        return {
          ok: true,
          result: {
            unreadMessages: unread.c,
            recentMessages: recentMsgs.map(m => ({ id: m.id, name: m.name, subject: m.subject, status: m.status, at: m.createdAt })),
          },
        };
      }
      case "get_dashboard_stats": {
        const [p] = await db.select({ c: count() }).from(projectsTable);
        const [b] = await db.select({ c: count() }).from(brokersTable);
        const [m] = await db.select({ c: count() }).from(messagesTable);
        const [u] = await db.select({ c: count() }).from(usersTable);
        const [j] = await db.select({ c: count() }).from(jobsTable);
        const [unread] = await db.select({ c: count() }).from(messagesTable).where(eq(messagesTable.status, "unread"));
        return {
          ok: true,
          result: {
            projects: p.c, brokers: b.c, messages: m.c, employees: u.c, jobs: j.c, unreadMessages: unread.c,
          },
        };
      }
      case "draft_project_description":
      case "analyze_market":
        // Pure-content tools — return args back; the model writes the body in the follow-up turn
        return { ok: true, result: { draft: true, args } };
      default:
        return { ok: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (err: any) {
    logger.error({ err, toolName }, "Tool execution failed");
    return { ok: false, error: err?.message || "execution failed" };
  }
}

function buildSystemPrompt(context?: string, userRole?: string): string {
  const roleNote = userRole === "super_admin" || userRole === "admin"
    ? "✅ المستخدم الحالي **مسؤول** — يمكنك تنفيذ كل الأدوات بما فيها النشر والإرسال."
    : "ℹ️ المستخدم الحالي **موظف** — يمكنك إرسال البريد ومراجعة المهام، لكن لا تستطيع النشر (محتاج موافقة الإدارة).";

  return `أنت **"نوى AI"** — الايجنت الإبداعي الذكي لمنصة نوى العقارية (nawainv.sa).
أنت مساعد دائم للموظفين، تتصرف كموظف خبير لا كأداة. تفهم السياق، تقترح الحلول، وتنفذ الإجراءات بنفسك.

## شخصيتك
- استباقي: عند سؤال غامض، اقترح أكثر من خيار وانفّذ الأنسب.
- إبداعي: محتواك يفوق الجودة العادية — نبرة فاخرة، عبارات تسويقية قوية، تنسيق احترافي.
- موجز: لا حشو. كل جملة تخدم هدفاً.
- ثنائي اللغة: الرد بنفس لغة المستخدم تلقائياً (عربي/إنجليزي).

## أدواتك (نفذ بنفسك دون انتظار إذن صريح إذا كان الطلب واضحاً):
1. **publish_news** — نشر خبر/إعلان مباشرة على الموقع (admin فقط)
2. **publish_job** — نشر وظيفة جديدة في صفحة الوظائف (admin فقط)
3. **send_email** — إرسال بريد فعلي للعميل عبر صندوق الموظف (info@ / ceo@ / ...) بقالب نوى الرسمي
4. **review_pending_tasks** — مراجعة الرسائل والطلبات المعلقة
5. **get_dashboard_stats** — إحصائيات حية للمنصة
6. **draft_project_description** — صياغة وصف مشروع
7. **analyze_market** — تحليل سوق العقارات السعودي

${roleNote}

## قواعد التنفيذ
- إذا طلب الموظف "أرسل بريد لـ X" → استدعِ send_email مباشرة بمحتوى مكتوب احترافياً.
- إذا طلب "انشر إعلان عن Y" أو "أعلن عن Y" → استدعِ publish_news مع العنوان والمحتوى الكامل بالعربي والإنجليزي.
- إذا طلب "افتح وظيفة" أو "أضف وظيفة" → استدعِ publish_job.
- إذا طلب "ايش المهام؟" / "ايش الجديد؟" → استدعِ review_pending_tasks.
- بعد كل تنفيذ ناجح، أكّد بإيجاز ماذا فعلت وأعرض النتيجة (مثال: "✅ نُشر الخبر — رقم #42").
- في فشل التنفيذ، اشرح السبب باختصار واقترح بديل.

## الهوية
الألوان: كحلي #0D1B3E + ذهبي #C9A96E — استخدمها في إيميلاتك (تُضاف تلقائياً).
الموقع: nawainv.sa | هاتف: +966500073509
${context ? `\n## سياق إضافي\n${context}` : ""}`;
}

// =====================================================================
// Main chat endpoint with tool execution loop
// =====================================================================
router.post("/ai/chat", requireAuth, async (req, res): Promise<void> => {
  const { message, context, history, useTools = true } = req.body;
  const authUser = (req as any).user;

  if (!message) { res.status(400).json({ error: "Message is required" }); return; }
  if (!KIMI_API_KEY) { res.status(503).json({ error: "AI service not configured" }); return; }

  const messages: any[] = [
    { role: "system", content: buildSystemPrompt(context, authUser?.role) },
  ];
  if (Array.isArray(history)) {
    for (const h of history) {
      if (h.role && h.content && (h.role === "user" || h.role === "assistant")) {
        messages.push({ role: h.role, content: String(h.content) });
      }
    }
  }
  messages.push({ role: "user", content: message });

  const executedTools: { toolName: string; args: any; ok: boolean; result?: any; error?: string }[] = [];

  try {
    // Up to 3 tool-call iterations
    for (let iter = 0; iter < 3; iter++) {
      const body: any = {
        model: KIMI_MODEL,
        messages,
        max_tokens: 4096,
        temperature: 0.6,
      };
      if (useTools) { body.tools = AGENT_TOOLS; body.tool_choice = "auto"; }

      const r = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${KIMI_API_KEY}` },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const t = await r.text();
        logger.error({ status: r.status, t }, "Kimi error");
        res.status(502).json({ error: "AI service error" });
        return;
      }

      const data = await r.json() as any;
      const choice = data.choices?.[0];
      const msg = choice?.message;
      const aiText = msg?.content || msg?.reasoning_content || "";
      const toolCalls = msg?.tool_calls || [];

      if (!toolCalls.length) {
        res.json({ response: aiText, toolCalls: executedTools, tokensUsed: data.usage?.total_tokens ?? null });
        return;
      }

      // Execute each tool, then loop with results
      messages.push({ role: "assistant", content: aiText || "", tool_calls: toolCalls });
      for (const tc of toolCalls) {
        const args = (() => { try { return JSON.parse(tc.function?.arguments || "{}"); } catch { return {}; } })();
        const exec = await executeTool(tc.function?.name, args, authUser);
        executedTools.push({ toolName: tc.function?.name, args, ok: exec.ok, result: exec.result, error: exec.error });
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(exec.ok ? { success: true, ...exec.result } : { success: false, error: exec.error }),
        });
      }
    }

    res.json({ response: "تم تنفيذ الإجراءات. (وصلت لأقصى عدد من الخطوات).", toolCalls: executedTools });
  } catch (err) {
    logger.error({ err }, "AI chat failed");
    res.status(500).json({ error: "Failed to reach AI service" });
  }
});

// =====================================================================
// Streaming endpoint — text-only (no tools)
// =====================================================================
router.post("/ai/stream", requireAuth, async (req, res): Promise<void> => {
  const { message, context, history } = req.body;
  const authUser = (req as any).user;
  if (!message || !KIMI_API_KEY) { res.status(400).json({ error: "Message and API key required" }); return; }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const messages: any[] = [{ role: "system", content: buildSystemPrompt(context, authUser?.role) }];
  if (Array.isArray(history)) {
    for (const h of history) {
      if (h.role && h.content && (h.role === "user" || h.role === "assistant")) {
        messages.push({ role: h.role, content: String(h.content) });
      }
    }
  }
  messages.push({ role: "user", content: message });

  try {
    const r = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KIMI_API_KEY}` },
      body: JSON.stringify({ model: KIMI_MODEL, messages, max_tokens: 2048, temperature: 0.6, stream: true }),
    });
    if (!r.ok || !r.body) {
      res.write(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`);
      res.end(); return;
    }
    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter(l => l.startsWith("data: "));
      for (const line of lines) res.write(line + "\n\n");
      // @ts-ignore
      if (typeof (res as any).flush === "function") (res as any).flush();
    }
    res.end();
  } catch (err) {
    logger.error({ err }, "Streaming failed");
    res.write(`data: ${JSON.stringify({ error: "Streaming error" })}\n\n`);
    res.end();
  }
});

// Helper for other routes to ask Kimi for content (used by message auto-reply etc.)
export async function generateAiText(prompt: string, system?: string, maxTokens = 512): Promise<string> {
  if (!KIMI_API_KEY) return "";
  try {
    const r = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KIMI_API_KEY}` },
      body: JSON.stringify({
        model: KIMI_MODEL,
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          { role: "user", content: prompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });
    if (!r.ok) return "";
    const data = await r.json() as any;
    const m = data.choices?.[0]?.message;
    return m?.content || m?.reasoning_content || "";
  } catch {
    return "";
  }
}

export default router;
