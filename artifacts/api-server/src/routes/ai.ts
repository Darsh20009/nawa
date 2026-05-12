import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";
import { openrouter } from "@workspace/integrations-openrouter-ai";

const router: IRouter = Router();

router.post("/ai/chat", requireAuth, async (req, res): Promise<void> => {
  const { message, context, history } = req.body;
  if (!message) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [];

  messages.push({
    role: "system",
    content: `أنت مساعد ذكي متخصص في القطاع العقاري لمنصة نوى العقارية. أنت خبير في الاستثمار العقاري في المملكة العربية السعودية وتقدم مساعدة احترافية وذكية للموظفين والمديرين. ${context || ""}

You are Nawa AI Assistant — an intelligent agent specialized in Saudi real estate investment and management. Provide expert advice on property investment, market analysis, content generation, valuations, and business insights. Be professional, precise, and helpful in both Arabic and English. Always respond in the same language as the user's message.`,
  });

  if (Array.isArray(history)) {
    for (const h of history) {
      if (h.role && h.content && (h.role === "user" || h.role === "assistant")) {
        messages.push({ role: h.role, content: h.content });
      }
    }
  }

  messages.push({ role: "user", content: message });

  try {
    const response = await openrouter.chat.completions.create({
      model: "qwen/qwen3.5-plus-20260420",
      messages,
      max_tokens: 8192,
      temperature: 0.7,
    });

    const aiMessage = response.choices?.[0]?.message?.content || "";

    res.json({
      response: aiMessage,
      tokensUsed: response.usage?.total_tokens ?? null,
    });
  } catch (err) {
    logger.error({ err }, "Failed to call AI");
    res.status(500).json({ error: "Failed to reach AI service" });
  }
});

export default router;
