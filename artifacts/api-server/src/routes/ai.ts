import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const KIMI_API_KEY = process.env.KIMI_API_KEY || "";
const KIMI_BASE_URL = "https://api.moonshot.ai/v1";
const KIMI_MODEL = "kimi-k2.6";

// Kimi AI Agent Tools — actions the AI can suggest/perform
const AGENT_TOOLS = [
  {
    type: "function",
    function: {
      name: "draft_project_description",
      description: "Generate a professional Arabic/English real estate project description for nawainv.sa",
      parameters: {
        type: "object",
        properties: {
          projectName: { type: "string", description: "Name of the project" },
          location: { type: "string", description: "Location of the project" },
          type: { type: "string", description: "Type: residential, commercial, mixed" },
          features: { type: "array", items: { type: "string" }, description: "Key features" },
          language: { type: "string", enum: ["ar", "en", "both"], description: "Output language" },
        },
        required: ["projectName", "location", "type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "draft_news_article",
      description: "Write a professional news article or press release for Nawa Real Estate media center",
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string", description: "Article topic" },
          keyPoints: { type: "array", items: { type: "string" } },
          language: { type: "string", enum: ["ar", "en", "both"] },
          tone: { type: "string", enum: ["formal", "engaging", "press-release"] },
        },
        required: ["topic"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "draft_email",
      description: "Compose a professional business email for Nawa Real Estate",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string" },
          subject: { type: "string" },
          purpose: { type: "string", description: "Purpose of the email" },
          fromDepartment: { type: "string", enum: ["ceo", "finance", "marketing", "investment", "support", "cob"] },
          language: { type: "string", enum: ["ar", "en"] },
        },
        required: ["subject", "purpose"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyze_market",
      description: "Provide Saudi real estate market analysis, trends, and investment recommendations",
      parameters: {
        type: "object",
        properties: {
          region: { type: "string", description: "Saudi region: Riyadh, Jeddah, etc." },
          segment: { type: "string", enum: ["residential", "commercial", "industrial", "hospitality"] },
          timeframe: { type: "string", enum: ["current", "q1-2026", "2026", "5-year"] },
        },
        required: ["region", "segment"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_seo_content",
      description: "Generate SEO-optimized content for Nawa Real Estate website pages",
      parameters: {
        type: "object",
        properties: {
          pageType: { type: "string", enum: ["home", "project", "service", "about", "careers"] },
          keywords: { type: "array", items: { type: "string" } },
          language: { type: "string", enum: ["ar", "en"] },
        },
        required: ["pageType"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "suggest_investment_strategy",
      description: "Provide tailored real estate investment strategy recommendations for Saudi market",
      parameters: {
        type: "object",
        properties: {
          budget: { type: "string" },
          goal: { type: "string", enum: ["capital-growth", "rental-income", "quick-flip", "portfolio-diversification"] },
          riskTolerance: { type: "string", enum: ["low", "medium", "high"] },
          timeline: { type: "string" },
        },
        required: ["goal"],
      },
    },
  },
];

// System prompt for Kimi AI Agent
function buildSystemPrompt(context?: string): string {
  return `أنت "نوى AI" — المساعد الذكي المتقدم لنوى العقارية (nawainv.sa). أنت خبير عالمي في:

🏢 الاستثمار والتطوير العقاري في المملكة العربية السعودية
📊 تحليل السوق العقاري والاتجاهات
✍️ كتابة المحتوى العقاري الاحترافي (عربي/إنجليزي)
📧 صياغة المراسلات التجارية الرسمية
📈 استراتيجيات التسويق العقاري
⚖️ التشريعات والأنظمة العقارية السعودية
🤖 الأتمتة وإدارة العمليات

قدراتك كـ Agent:
- يمكنك صياغة محتوى جاهز للنشر مباشرة في النظام
- تحليل البيانات وتقديم توصيات استراتيجية
- كتابة تقارير احترافية ومقالات إعلامية
- صياغة رسائل بريد إلكتروني رسمية من بريد نوى
- اقتراح استراتيجيات تسويق وSEO

الهوية والألوان: كحلي #0D1B3E وذهبي #C9A96E
الموقع: nawainv.sa | الهاتف: +966 50 007 3509
التطوير: Qirox Studio

قواعد الرد:
- رد دائماً بنفس لغة المستخدم (عربي أو إنجليزي)
- كن دقيقاً، احترافياً، وعملياً
- عند الطلب قدم محتوى كاملاً جاهزاً للاستخدام
- أضف ✨ للمحتوى الجديد و📋 للتحليلات و📧 للمراسلات

${context ? `\nسياق إضافي: ${context}` : ""}`;
}

router.post("/ai/chat", requireAuth, async (req, res): Promise<void> => {
  const { message, context, history, useTools = true } = req.body;
  
  if (!message) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  if (!KIMI_API_KEY) {
    res.status(503).json({ error: "AI service not configured" });
    return;
  }

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: buildSystemPrompt(context) },
  ];

  if (Array.isArray(history)) {
    for (const h of history) {
      if (h.role && h.content && (h.role === "user" || h.role === "assistant")) {
        messages.push({ role: h.role, content: String(h.content) });
      }
    }
  }

  messages.push({ role: "user", content: message });

  try {
    const body: any = {
      model: KIMI_MODEL,
      messages,
      max_tokens: 4096,
      temperature: 0.7,
    };

    if (useTools) {
      body.tools = AGENT_TOOLS;
      body.tool_choice = "auto";
    }

    const response = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KIMI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.error({ status: response.status, errText }, "Kimi API error");
      res.status(500).json({ error: "AI service error" });
      return;
    }

    const data = await response.json() as any;
    const choice = data.choices?.[0];
    const aiMessage = choice?.message?.content || choice?.message?.reasoning_content || "";
    const toolCalls = choice?.message?.tool_calls || [];

    // If tool calls, execute them and return results
    if (toolCalls.length > 0) {
      const toolResults = toolCalls.map((tc: any) => {
        const args = JSON.parse(tc.function?.arguments || "{}");
        return {
          toolName: tc.function?.name,
          args,
          result: `✨ تم إنشاء المحتوى بنجاح لـ: ${tc.function?.name}\n\nالمعاملات: ${JSON.stringify(args, null, 2)}`,
        };
      });

      // Follow-up call with tool results to get final response
      const followUpMessages = [
        ...messages,
        { role: "assistant" as const, content: aiMessage || "", ...(toolCalls.length ? { tool_calls: toolCalls } : {}) },
        ...toolCalls.map((tc: any, i: number) => ({
          role: "tool" as const,
          tool_call_id: tc.id,
          content: `Tool ${tc.function?.name} executed successfully with args: ${tc.function?.arguments}`,
        })),
      ];

      const followUpBody = {
        model: KIMI_MODEL,
        messages: followUpMessages,
        max_tokens: 4096,
        temperature: 0.7,
      };

      const followUpRes = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${KIMI_API_KEY}`,
        },
        body: JSON.stringify(followUpBody),
      });

      if (followUpRes.ok) {
        const followUpData = await followUpRes.json() as any;
        const fc = followUpData.choices?.[0]?.message;
        const finalMessage = fc?.content || fc?.reasoning_content || aiMessage;
        res.json({
          response: finalMessage,
          toolCalls: toolResults,
          tokensUsed: data.usage?.total_tokens ?? null,
        });
        return;
      }
    }

    res.json({
      response: aiMessage,
      toolCalls: [],
      tokensUsed: data.usage?.total_tokens ?? null,
    });
  } catch (err) {
    logger.error({ err }, "Failed to call Kimi AI");
    res.status(500).json({ error: "Failed to reach AI service" });
  }
});

// Streaming endpoint for real-time AI responses
router.post("/ai/stream", requireAuth, async (req, res): Promise<void> => {
  const { message, context, history } = req.body;
  
  if (!message || !KIMI_API_KEY) {
    res.status(400).json({ error: "Message and API key required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: buildSystemPrompt(context) },
  ];

  if (Array.isArray(history)) {
    for (const h of history) {
      if (h.role && h.content && (h.role === "user" || h.role === "assistant")) {
        messages.push({ role: h.role, content: String(h.content) });
      }
    }
  }

  messages.push({ role: "user", content: message });

  try {
    const response = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KIMI_API_KEY}`,
      },
      body: JSON.stringify({
        model: KIMI_MODEL,
        messages,
        max_tokens: 2048,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      res.write(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`);
      res.end();
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter(l => l.startsWith("data: "));
      for (const line of lines) {
        res.write(line + "\n\n");
      }
    }
    res.end();
  } catch (err) {
    logger.error({ err }, "Streaming failed");
    res.write(`data: ${JSON.stringify({ error: "Streaming error" })}\n\n`);
    res.end();
  }
});

export default router;
