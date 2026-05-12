import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useAiChat } from "@workspace/api-client-react";
import {
  Bot, Send, User, Sparkles, Brain, FileText, Mail,
  TrendingUp, Zap, Copy, Check, Volume2, VolumeX,
  ChevronDown, RotateCcw, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { isSoundEnabled, setSoundEnabled, playSuccess } from "@/lib/sounds";

interface Message {
  role: "user" | "assistant";
  content: string;
  toolCalls?: { toolName: string; args: any }[];
  timestamp: Date;
}

const QUICK_PROMPTS = {
  ar: [
    { icon: FileText, label: "صياغة وصف مشروع", prompt: "اكتب وصفاً احترافياً لمشروع سكني فاخر في الرياض بمساحة 500 متر مربع" },
    { icon: Mail, label: "رسالة بريدية", prompt: "اكتب رسالة بريد إلكتروني رسمية لعميل مهتم بالاستثمار العقاري" },
    { icon: TrendingUp, label: "تحليل السوق", prompt: "قدم تحليلاً لسوق العقارات في الرياض خلال 2026" },
    { icon: Sparkles, label: "محتوى SEO", prompt: "اكتب محتوى محسناً لمحركات البحث لصفحة المشاريع العقارية" },
    { icon: Brain, label: "استراتيجية استثمار", prompt: "ما أفضل استراتيجية للاستثمار العقاري في السعودية بميزانية 2 مليون ريال؟" },
    { icon: Search, label: "تقرير عقاري", prompt: "أنشئ تقريراً مفصلاً عن المناطق الواعدة للاستثمار العقاري في المملكة" },
  ],
  en: [
    { icon: FileText, label: "Project Description", prompt: "Write a professional description for a luxury residential project in Riyadh" },
    { icon: Mail, label: "Business Email", prompt: "Compose a formal email to an investor interested in Nawa Real Estate" },
    { icon: TrendingUp, label: "Market Analysis", prompt: "Provide a Saudi real estate market analysis for 2026" },
    { icon: Sparkles, label: "SEO Content", prompt: "Write SEO-optimized content for our real estate projects page" },
    { icon: Brain, label: "Investment Strategy", prompt: "Best investment strategy for Saudi real estate with 2M SAR budget?" },
    { icon: Search, label: "Investment Report", prompt: "Create a detailed report on promising real estate areas in Saudi Arabia" },
  ],
};

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, 8);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span className="whitespace-pre-wrap leading-relaxed">
      {displayed}
      {!done && <span className="inline-block w-0.5 h-4 bg-primary/70 animate-pulse ml-0.5 align-text-bottom" />}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/5">
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
    </button>
  );
}

export function AiChat() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: isAr
        ? "مرحباً! 👋 أنا **نوى AI** — مساعدك الذكي المتخصص في العقارات السعودية.\n\nيمكنني مساعدتك في:\n• ✍️ صياغة محتوى المشاريع والأخبار\n• 📊 تحليل السوق العقاري\n• 📧 كتابة المراسلات الرسمية\n• 🔍 استراتيجيات الاستثمار والتسويق\n\nكيف يمكنني مساعدتك اليوم؟"
        : "Hello! 👋 I'm **Nawa AI** — your intelligent Saudi real estate assistant.\n\nI can help with:\n• ✍️ Drafting project content & news articles\n• 📊 Market analysis & reports\n• 📧 Professional business emails\n• 🔍 Investment & marketing strategies\n\nHow can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [soundOn, setSoundState] = useState(isSoundEnabled);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastMsgRef = useRef<HTMLDivElement>(null);

  const aiChatMutation = useAiChat({
    mutation: {
      onSuccess: (data) => {
        const content = data.response || "";
        const toolCalls = (data as any).toolCalls || [];
        setMessages(prev => [...prev, {
          role: "assistant",
          content,
          toolCalls,
          timestamp: new Date(),
        }]);
        if (soundOn) playSuccess();
        scrollToBottom();
      },
      onError: () => {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: isAr ? "عذراً، حدث خطأ. يرجى المحاولة مرة أخرى." : "Sorry, an error occurred. Please try again.",
          timestamp: new Date(),
        }]);
      },
    },
  });

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      lastMsgRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || aiChatMutation.isPending) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: text, timestamp: new Date() }]);
    aiChatMutation.mutate({
      data: {
        message: text,
        history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
      },
    });
    scrollToBottom();
  }, [input, aiChatMutation, messages, scrollToBottom]);

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  const clearChat = () => {
    setMessages([{
      role: "assistant",
      content: isAr ? "تم مسح المحادثة. كيف يمكنني مساعدتك؟" : "Chat cleared. How can I help you?",
      timestamp: new Date(),
    }]);
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundState(next);
  };

  const prompts = QUICK_PROMPTS[isAr ? "ar" : "en"];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-5 py-3.5 border-b border-border bg-gradient-to-l from-primary to-primary/90 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
              <Bot className="w-5 h-5" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-primary" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-sm">{isAr ? "نوى AI — المساعد الذكي" : "Nawa AI — Smart Agent"}</h2>
              <span className="text-[10px] bg-yellow-400/20 text-yellow-200 border border-yellow-400/30 px-1.5 py-0.5 rounded-full font-medium">
                {isAr ? "وكيل ذكي" : "Agent"}
              </span>
            </div>
            <p className="text-[11px] text-white/60 flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-300" />
              {isAr ? "Kimi AI · 32K Context · أدوات متقدمة" : "Kimi AI · 32K Context · Advanced Tools"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={toggleSound} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title={soundOn ? "كتم الصوت" : "تفعيل الصوت"}>
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 opacity-50" />}
          </button>
          <button onClick={clearChat} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title={isAr ? "محادثة جديدة" : "New Chat"}>
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="shrink-0 px-4 py-2 border-b border-border bg-muted/30 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {prompts.map((p, i) => {
            const Icon = p.icon;
            return (
              <button
                key={i}
                onClick={() => handleQuickPrompt(p.prompt)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-white border border-border hover:border-primary/40 hover:bg-primary/5 transition-all whitespace-nowrap text-foreground/70 hover:text-primary"
              >
                <Icon className="w-3 h-3" />
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5" ref={scrollRef}>
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              ref={i === messages.length - 1 ? lastMsgRef : null}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn("flex gap-3 group", msg.role === "user" ? "flex-row-reverse" : "")}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                msg.role === "user" ? "bg-secondary/80 text-foreground" : "bg-primary/10 text-primary border border-primary/20"
              )}>
                {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={cn("flex flex-col gap-1 max-w-[82%]", msg.role === "user" ? "items-end" : "items-start")}>
                <div className={cn(
                  "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted/60 text-foreground rounded-tl-sm border border-border/50"
                )}>
                  {msg.role === "assistant" && i === messages.length - 1 && !aiChatMutation.isPending ? (
                    <TypewriterText text={msg.content} />
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}
                </div>

                {/* Tool calls badge */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {msg.toolCalls.map((tc, ti) => (
                      <span key={ti} className="text-[10px] bg-yellow-100 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" />
                        {tc.toolName?.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">
                    {msg.timestamp.toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {msg.role === "assistant" && <CopyButton text={msg.content} />}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {aiChatMutation.isPending && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-muted/60 border border-border/50 flex gap-1.5 items-center">
              <span className="text-xs text-muted-foreground">{isAr ? "يفكر..." : "Thinking..."}</span>
              {[0, 150, 300].map(d => (
                <span key={d} className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={lastMsgRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 p-4 border-t border-border bg-white/80 backdrop-blur">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              placeholder={isAr ? "اسألني أي شيء... (Enter للإرسال، Shift+Enter للسطر الجديد)" : "Ask anything... (Enter to send, Shift+Enter for new line)"}
              className="resize-none rounded-xl px-4 py-3 text-sm bg-muted/30 border-border min-h-[46px] max-h-32 pr-10"
              rows={1}
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || aiChatMutation.isPending}
            className="rounded-xl h-[46px] w-[46px] shrink-0 bg-primary hover:bg-primary/90"
          >
            <Send className={cn("w-4 h-4", isAr && "-scale-x-100")} />
          </Button>
        </form>
        <p className="text-center text-[10px] text-muted-foreground/50 mt-2">
          {isAr ? "نوى AI · مدعوم بـ Kimi Moonshot · للاستخدام الداخلي فقط" : "Nawa AI · Powered by Kimi Moonshot · Internal use only"}
        </p>
      </div>
    </div>
  );
}
