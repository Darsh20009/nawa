import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/ai/chat", requireAuth, async (req, res): Promise<void> => {
  const { message, context, history } = req.body;
  if (!message) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "AI service not configured" });
    return;
  }

  const messages: { role: string; content: string }[] = [];

  messages.push({
    role: "system",
    content: `أنت مساعد ذكي متخصص في القطاع العقاري لمنصة نوى العقارية. أنت خبير في الاستثمار العقاري في المملكة العربية السعودية وتقدم مساعدة احترافية وذكية للموظفين والمديرين. ${context || ""}

You are Nawa AI Assistant — an intelligent agent specialized in Saudi real estate. Provide expert advice on property investment, market analysis, content generation, and business insights. Be professional, precise, and helpful.`,
  });

  if (Array.isArray(history)) {
    for (const h of history) {
      if (h.role && h.content) {
        messages.push({ role: h.role, content: h.content });
      }
    }
  }

  messages.push({ role: "user", content: message });

  try {
    const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "moonshot-v1-8k",
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      logger.error({ status: response.status, err }, "Kimi AI error");
      res.status(500).json({ error: "AI service error" });
      return;
    }

    const data = (await response.json()) as {
      choices: { message: { content: string } }[];
      usage?: { total_tokens?: number };
    };
    const aiMessage = data.choices?.[0]?.message?.content || "";

    res.json({
      response: aiMessage,
      tokensUsed: data.usage?.total_tokens ?? null,
    });
  } catch (err) {
    logger.error({ err }, "Failed to call Kimi AI");
    res.status(500).json({ error: "Failed to reach AI service" });
  }
});

export default router;
