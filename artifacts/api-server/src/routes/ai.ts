import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";
import { News, Job, Message, Project, Broker, User } from "@workspace/db";
import { sendNawaMail, wrapNawaEmailHtml, NAWA_EMAIL_ACCOUNTS } from "../lib/mailer";

const router: IRouter = Router();

const KIMI_API_KEY = process.env.KIMI_API_KEY || "";
const KIMI_BASE_URL = "https://api.moonshot.ai/v1";
const KIMI_MODEL = "kimi-k2.6";
// Fast non-reasoning model for utility endpoints (text-action, classify, public-chat)
// Reasoning models leak chain-of-thought into the content field; turbo doesn't.
const KIMI_FAST_MODEL = process.env.KIMI_FAST_MODEL || "moonshot-v1-32k";

// Strip leading reasoning preambles ("The user wants...", "Let me analyze...", etc.)
// in case any model leaks chain-of-thought into the content.
function cleanAiOutput(s: string): string {
  if (!s) return "";
  let out = s.trim();
  // Strip only a SHORT leading preamble (max ~200 chars). Never throw away most of the output.
  const leadingPreamble = /^(?:(?:The user (?:wants|is asking|needs)|Let me (?:analyze|think|look)|I(?:'| a)m going to|Here(?:'s| is) (?:the |an? )?(?:rewritten|improved|translated|summarized|reply)[^\n:]{0,40}:?)[^\n]{0,200}\n+){1,2}/i;
  out = out.replace(leadingPreamble, "").trim();
  // Strip surrounding quotes only if they wrap the entire string
  if ((out.startsWith('"') && out.endsWith('"')) || (out.startsWith("'") && out.endsWith("'"))) {
    out = out.slice(1, -1).trim();
  }
  return out;
}

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
        const titleAr = typeof args.titleAr === "string" ? args.titleAr.trim() : "";
        const title = typeof args.title === "string" ? args.title.trim() : titleAr;
        const contentAr = typeof args.contentAr === "string" ? args.contentAr.trim() : "";
        if (!titleAr || !title) return { ok: false, error: "العنوان بالعربي والإنجليزي إلزامي" };
        if (!contentAr) return { ok: false, error: "محتوى الخبر بالعربي إلزامي" };
        const row = await News.create({
          title,
          titleAr,
          content: typeof args.content === "string" ? args.content : contentAr,
          contentAr,
          category: typeof args.category === "string" ? args.category : "news",
          featured: !!args.featured,
          publishedAt: new Date(),
        });
        return { ok: true, result: { id: row.id, title: row.titleAr, kind: "news" } };
      }
      case "publish_job": {
        if (!isAdmin(authUser)) return { ok: false, error: "صلاحية النشر مطلوبة (admin)" };
        const titleAr = typeof args.titleAr === "string" ? args.titleAr.trim() : "";
        const title = typeof args.title === "string" ? args.title.trim() : titleAr;
        const departmentAr = typeof args.departmentAr === "string" ? args.departmentAr.trim() : "";
        const department = typeof args.department === "string" ? args.department.trim() : departmentAr;
        if (!titleAr || !title) return { ok: false, error: "اسم الوظيفة بالعربي والإنجليزي إلزامي" };
        if (!departmentAr || !department) return { ok: false, error: "القسم إلزامي" };
        const row = await Job.create({
          title,
          titleAr,
          department,
          departmentAr,
          description: typeof args.description === "string" ? args.description : null,
          descriptionAr: typeof args.descriptionAr === "string" ? args.descriptionAr : null,
          requirements: typeof args.requirements === "string" ? args.requirements : null,
          requirementsAr: typeof args.requirementsAr === "string" ? args.requirementsAr : null,
          type: typeof args.type === "string" ? args.type : "full-time",
          location: typeof args.location === "string" ? args.location : "الرياض",
          active: true,
        });
        return { ok: true, result: { id: row.id, title: row.titleAr, kind: "job" } };
      }
      case "send_email": {
        const to = typeof args.to === "string" ? args.to.trim() : "";
        const subject = typeof args.subject === "string" ? args.subject.trim() : "";
        const bodyHtml = typeof args.bodyHtml === "string" ? args.bodyHtml : "";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return { ok: false, error: "بريد المستلم غير صالح" };
        if (!subject) return { ok: false, error: "موضوع البريد مطلوب" };
        if (!bodyHtml.trim()) return { ok: false, error: "محتوى البريد فارغ" };

        let from: any = "info@nawainv.sa";
        if (args.fromAccount && isAdmin(authUser) && (NAWA_EMAIL_ACCOUNTS as readonly string[]).includes(args.fromAccount)) {
          from = args.fromAccount;
        } else {
          const u = await User.findById(authUser.id, { emailAccount: 1 });
          if (u?.emailAccount && (NAWA_EMAIL_ACCOUNTS as readonly string[]).includes(u.emailAccount)) from = u.emailAccount;
        }
        const html = wrapNawaEmailHtml({ title: typeof args.title === "string" ? args.title : undefined, bodyHtml, lang: args.language === "en" ? "en" : "ar" });
        const r = await sendNawaMail({ from, to, subject, html });
        if (!r.ok) return { ok: false, error: r.error };
        return { ok: true, result: { sent: true, from, to, messageId: r.messageId } };
      }
      case "review_pending_tasks": {
        const limit = Math.min(Number(args.limit) || 5, 20);
        const [unread, recentMsgs] = await Promise.all([
          Message.countDocuments({ status: "unread" }),
          Message.find().sort({ createdAt: -1 }).limit(limit),
        ]);
        return {
          ok: true,
          result: {
            unreadMessages: unread,
            recentMessages: recentMsgs.map(m => ({ id: m.id, name: m.name, subject: m.subject, status: m.status, at: m.createdAt })),
          },
        };
      }
      case "get_dashboard_stats": {
        const [p, b, m, u, j, unread] = await Promise.all([
          Project.countDocuments(),
          Broker.countDocuments(),
          Message.countDocuments(),
          User.countDocuments(),
          Job.countDocuments(),
          Message.countDocuments({ status: "unread" }),
        ]);
        return {
          ok: true,
          result: { projects: p, brokers: b, messages: m, employees: u, jobs: j, unreadMessages: unread },
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
        temperature: 1,
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

      // Execute each tool, then loop with results.
      // Kimi k2.6 (thinking model) requires `reasoning_content` to be echoed back
      // alongside the tool_calls — otherwise it errors with
      //   "thinking is enabled but reasoning_content is missing".
      const assistantEcho: any = { role: "assistant", content: msg?.content ?? "", tool_calls: toolCalls };
      if (msg?.reasoning_content) assistantEcho.reasoning_content = msg.reasoning_content;
      messages.push(assistantEcho);
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
      body: JSON.stringify({ model: KIMI_MODEL, messages, max_tokens: 2048, temperature: 1, stream: true }),
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

// =====================================================================
// Generic text-action endpoint — improve/shorten/formalize/translate/etc.
// =====================================================================
const TEXT_ACTIONS: Record<string, { system: string; user: (text: string, ctx?: string) => string; maxTokens?: number }> = {
  improve: {
    system: "You are an expert Arabic & English copy editor. Improve the writing: fix grammar, clarity, flow, and tone. Keep the original language and meaning. Return ONLY the rewritten text, no preamble or quotes.",
    user: (t) => `Improve this text:\n\n${t}`,
    maxTokens: 800,
  },
  shorten: {
    system: "You shorten text while keeping every key point. Keep the original language. Return ONLY the shortened text.",
    user: (t) => `Shorten this text by ~50%:\n\n${t}`,
    maxTokens: 600,
  },
  expand: {
    system: "You expand short text into a richer, more professional version while keeping the original intent and language. Return ONLY the expanded text.",
    user: (t) => `Expand this text into a more detailed version:\n\n${t}`,
    maxTokens: 1000,
  },
  formalize: {
    system: "You rewrite text in a formal, professional, business-appropriate tone. Keep the original language. Return ONLY the rewritten text.",
    user: (t) => `Rewrite this in a formal professional tone:\n\n${t}`,
    maxTokens: 800,
  },
  friendly: {
    system: "You rewrite text in a warm, friendly, conversational tone. Keep the original language. Return ONLY the rewritten text.",
    user: (t) => `Rewrite this in a warm friendly tone:\n\n${t}`,
    maxTokens: 800,
  },
  fix: {
    system: "You fix only grammar, spelling and punctuation. Do not change meaning or style. Keep the original language. Return ONLY the corrected text.",
    user: (t) => `Fix grammar and spelling in:\n\n${t}`,
    maxTokens: 800,
  },
  translate_ar: {
    system: "You are a professional Arabic translator. Translate the input to natural, fluent Modern Standard Arabic. Return ONLY the Arabic translation.",
    user: (t) => `Translate to Arabic:\n\n${t}`,
    maxTokens: 1000,
  },
  translate_en: {
    system: "You are a professional English translator. Translate the input to natural, fluent business English. Return ONLY the English translation.",
    user: (t) => `Translate to English:\n\n${t}`,
    maxTokens: 1000,
  },
  summarize: {
    system: "You write extremely concise one-sentence summaries. Use the same language as the input. Return ONLY the summary, max 25 words.",
    user: (t) => `Summarize in one short sentence:\n\n${t}`,
    maxTokens: 200,
  },
  smart_reply: {
    system: "You draft polite, professional email replies on behalf of Nawa Real Estate (نوى العقارية). Match the language of the incoming email (Arabic or English). Be concise (3-6 sentences). Sign as 'فريق نوى العقارية' for Arabic or 'Nawa Real Estate Team' for English. Return ONLY the reply body, no subject line.",
    user: (t, ctx) => `Incoming email:\n\n${t}\n\n${ctx ? `Context/intent: ${ctx}\n\n` : ""}Draft a reply.`,
    maxTokens: 700,
  },
  describe_project: {
    system: "You write compelling Arabic real estate project descriptions for Nawa Real Estate. Style: professional, evocative, 3-4 short paragraphs, focused on lifestyle and value. Return ONLY the description in Arabic.",
    user: (t) => `Write a project description for: ${t}`,
    maxTokens: 900,
  },
  describe_news: {
    system: "You write Arabic press releases for Nawa Real Estate. Professional tone, 2-3 short paragraphs. Return ONLY the article body in Arabic.",
    user: (t) => `Write a news article body for headline: ${t}`,
    maxTokens: 900,
  },
};

router.post("/ai/text-action", requireAuth, async (req, res): Promise<void> => {
  if (!KIMI_API_KEY) { res.status(503).json({ error: "AI service unavailable" }); return; }
  const { action, text, context } = req.body as { action?: string; text?: string; context?: string };
  if (!action || !text || typeof text !== "string") {
    res.status(400).json({ error: "action and text are required" }); return;
  }
  const cfg = TEXT_ACTIONS[action];
  if (!cfg) { res.status(400).json({ error: `Unknown action: ${action}` }); return; }
  const truncated = text.slice(0, 8000);
  const result = await generateAiText(cfg.user(truncated, context), cfg.system, cfg.maxTokens || 800, KIMI_FAST_MODEL, 0.3);
  if (!result) { res.status(502).json({ error: "AI returned empty" }); return; }
  res.json({ result: cleanAiOutput(result) });
});

// =====================================================================
// Classify a contact-form message: category + priority
// =====================================================================
router.post("/ai/classify-message", requireAuth, async (req, res): Promise<void> => {
  if (!KIMI_API_KEY) { res.status(503).json({ error: "AI service unavailable" }); return; }
  const { subject, body } = req.body as { subject?: string; body?: string };
  if (!body) { res.status(400).json({ error: "body required" }); return; }
  const sys = `You are a strict JSON classifier for Nawa Real Estate customer messages. Output ONLY a single JSON object, no other text, no markdown, no code fences. Schema:
{"category":"inquiry|complaint|investment|partnership|career|media|support|other","priority":"low|medium|high|urgent","summary":"one short sentence in same language as input","language":"ar|en"}
Rules: complaints with words like شكوى/غاضب/مرفوض/angry/refund => priority urgent. Investment requests => investment + high. Partnership offers => partnership + medium.`;
  const out = await generateAiText(`Subject: ${subject || ""}\n\nBody: ${body.slice(0, 4000)}\n\nOutput JSON now:`, sys, 300, KIMI_FAST_MODEL, 0.1);
  try {
    const m = out.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("no json");
    res.json(JSON.parse(m[0]));
  } catch {
    res.json({ category: "other", priority: "medium", summary: "", language: "ar" });
  }
});

// =====================================================================
// Public chatbot — no auth, scoped to public Nawa info
// =====================================================================
const publicChatRateLimit = new Map<string, { count: number; resetAt: number }>();
function checkPublicRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = publicChatRateLimit.get(ip);
  if (!entry || entry.resetAt < now) {
    publicChatRateLimit.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}

router.post("/ai/public-chat", async (req, res): Promise<void> => {
  if (!KIMI_API_KEY) { res.status(503).json({ error: "AI service unavailable" }); return; }
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown";
  if (!checkPublicRateLimit(ip)) { res.status(429).json({ error: "Too many requests" }); return; }
  const { message, history } = req.body as { message?: string; history?: Array<{ role: string; content: string }> };
  if (!message || typeof message !== "string") { res.status(400).json({ error: "message required" }); return; }

  // Pull live public data so chatbot answers from real database, not hallucinations
  // Only allow explicitly public statuses — never $ne filters which leak future statuses
  const PUBLIC_PROJECT_STATUSES = ["active", "completed", "in_progress", "planning", "available"];
  const [projects, services, news] = await Promise.all([
    Project.find({ status: { $in: PUBLIC_PROJECT_STATUSES } }).select("titleAr title locationAr location type status priceFromSar").limit(15).lean(),
    (await import("@workspace/db")).Service.find().select("titleAr title descriptionAr description").limit(10).lean(),
    News.find({ status: "published" }).select("titleAr title category publishedAt").sort({ publishedAt: -1 }).limit(5).lean(),
  ]);

  const trim = (s: any, n: number) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);
  const dataContext = `
=== Nawa Real Estate live data ===
Projects (${projects.length}):
${projects.map((p: any) => `- ${trim(p.titleAr || p.title, 80)} | ${trim(p.locationAr || p.location, 40)} | type: ${trim(p.type, 20)} | status: ${trim(p.status, 20)}${p.priceFromSar ? ` | from ${p.priceFromSar} SAR` : ""}`).join("\n")}

Services (${services.length}):
${services.map((s: any) => `- ${trim(s.titleAr || s.title, 60)}: ${trim(s.descriptionAr || s.description, 100)}`).join("\n")}

Latest news:
${news.map((n: any) => `- [${trim(n.category, 20)}] ${trim(n.titleAr || n.title, 80)}`).join("\n")}

Contact: info@nawainv.sa | +966500073509 | Riyadh, Saudi Arabia
Website: nawainv.sa
`;

  const system = `You are "نوى" (Nawa) — the friendly Arabic-first AI assistant for Nawa Real Estate (نوى العقارية). 
Answer in the SAME language as the user (Arabic by default). 
Be warm, concise (max 4 short sentences unless asked for detail), and helpful. 
Use ONLY facts from the live data below. If you don't know, say so politely and suggest contacting the team. 
Never invent prices, projects, or contact info. 
For specific queries (viewing, pricing, partnerships) suggest contacting info@nawainv.sa or +966500073509.

${dataContext}`;

  const messages: any[] = [{ role: "system", content: system }];
  if (Array.isArray(history)) {
    for (const h of history.slice(-8)) {
      if ((h.role === "user" || h.role === "assistant") && typeof h.content === "string") {
        messages.push({ role: h.role, content: h.content.slice(0, 1000) });
      }
    }
  }
  messages.push({ role: "user", content: message.slice(0, 1000) });

  try {
    const r = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KIMI_API_KEY}` },
      body: JSON.stringify({ model: KIMI_FAST_MODEL, messages, max_tokens: 600, temperature: 0.6 }),
    });
    if (!r.ok) {
      const errBody = await r.text().catch(() => "");
      logger.error({ status: r.status, body: errBody.slice(0, 500) }, "public-chat upstream failed");
      res.status(502).json({ error: "AI upstream failed" }); return;
    }
    const data = await r.json() as any;
    const raw = data.choices?.[0]?.message?.content || data.choices?.[0]?.message?.reasoning_content || "";
    res.json({ reply: cleanAiOutput(raw) });
  } catch (err) {
    logger.error({ err }, "public-chat failed");
    res.status(502).json({ error: "AI request failed" });
  }
});

// Helper for other routes to ask Kimi for content (used by message auto-reply etc.)
export async function generateAiText(prompt: string, system?: string, maxTokens = 512, modelOverride?: string, temperature?: number): Promise<string> {
  if (!KIMI_API_KEY) return "";
  try {
    const r = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KIMI_API_KEY}` },
      body: JSON.stringify({
        model: modelOverride || KIMI_MODEL,
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          { role: "user", content: prompt },
        ],
        max_tokens: maxTokens,
        temperature: temperature ?? 1,
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
