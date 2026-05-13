import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "nawa_public_chat_history";

export function AIChatWidget() {
  const { language } = useLanguage();
  const ar = language === "ar";
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20))); } catch {}
    }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const greeting = ar
    ? "أهلاً بك في نوى العقارية 👋 أنا نوى، مساعدك الذكي. اسألني عن مشاريعنا أو خدماتنا أو أي شيء يخص العقار."
    : "Welcome to Nawa Real Estate 👋 I'm Nawa, your AI assistant. Ask me about our projects, services, or anything real estate.";

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const newMessages: ChatMsg[] = [...messages, { role: "user" as const, content: text }];
    setMessages(newMessages);
    setInput("");
    setBusy(true);
    try {
      const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
      const r = await fetch(`${base}/api/ai/public-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: newMessages.slice(-8) }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        const errMsg = r.status === 429
          ? (ar ? "كثرة طلبات. حاول بعد دقيقة." : "Too many requests. Try again in a minute.")
          : (ar ? "تعذّر الاتصال الآن. يرجى التواصل عبر info@nawainv.sa" : "Could not connect. Please contact info@nawainv.sa");
        setMessages(m => [...m, { role: "assistant", content: errMsg }]);
      } else {
        setMessages(m => [...m, { role: "assistant", content: data.reply || (ar ? "لم أفهم، أعد صياغة سؤالك." : "I didn't understand, please rephrase.") }]);
      }
    } catch {
      setMessages(m => [...m, { role: "assistant", content: ar ? "حدث خطأ. حاول لاحقاً." : "Something went wrong." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            key="trigger"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-5 z-[60] end-5 group flex items-center gap-2 bg-primary text-primary-foreground rounded-full shadow-2xl hover:shadow-primary/40 px-4 py-3 hover:scale-105 transition-all"
            aria-label={ar ? "افتح المساعد الذكي" : "Open AI assistant"}
          >
            <div className="relative">
              <MessageCircle className="w-5 h-5" />
              <Sparkles className="w-3 h-3 absolute -top-1 -end-1 text-yellow-300 animate-pulse" />
            </div>
            <span className="text-sm font-semibold whitespace-nowrap pe-1">{ar ? "نوى الذكي" : "Nawa AI"}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-5 z-[60] end-5 w-[min(380px,calc(100vw-2rem))] h-[min(580px,calc(100vh-3rem))] bg-white rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden"
            dir={ar ? "rtl" : "ltr"}
          >
            <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold leading-tight">{ar ? "نوى" : "Nawa"}</div>
                  <div className="text-[11px] opacity-90 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                    {ar ? "متصل • مساعد ذكي" : "Online • AI Assistant"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label={ar ? "إغلاق" : "Close"}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
              {messages.length === 0 && (
                <div className="bg-white rounded-2xl rounded-ss-sm p-3 shadow-sm text-sm text-foreground/90 max-w-[85%]">
                  {greeting}
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-se-sm"
                        : "bg-white text-foreground rounded-ss-sm"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl rounded-ss-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>

            {messages.length === 0 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {(ar
                  ? ["ما هي مشاريعكم؟", "كيف أتواصل معكم؟", "ما هي خدماتكم؟"]
                  : ["What projects?", "How to contact?", "Your services?"]
                ).map(s => (
                  <button
                    key={s}
                    onClick={() => { setInput(s); }}
                    className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="border-t border-border p-3 bg-white flex items-end gap-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={ar ? "اكتب رسالتك..." : "Type a message..."}
                rows={1}
                className="flex-1 resize-none text-sm bg-muted/50 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/40 max-h-32"
                disabled={busy}
              />
              <Button
                size="icon"
                onClick={send}
                disabled={busy || !input.trim()}
                className="rounded-full shrink-0 w-9 h-9"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
