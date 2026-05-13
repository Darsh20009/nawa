import { useState } from "react";
import { Sparkles, Wand2, Minimize2, Maximize2, Languages, Briefcase, Smile, SpellCheck2, Loader2, Reply, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";

type Action = "improve" | "shorten" | "expand" | "formalize" | "friendly" | "fix" | "translate_ar" | "translate_en" | "summarize" | "smart_reply" | "describe_project" | "describe_news";

interface AiAction {
  key: Action;
  labelAr: string;
  labelEn: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ALL_ACTIONS: AiAction[] = [
  { key: "improve", labelAr: "حسّن النص", labelEn: "Improve", icon: Wand2 },
  { key: "fix", labelAr: "صحّح الأخطاء", labelEn: "Fix grammar", icon: SpellCheck2 },
  { key: "shorten", labelAr: "اختصر", labelEn: "Shorten", icon: Minimize2 },
  { key: "expand", labelAr: "وسّع وفصّل", labelEn: "Expand", icon: Maximize2 },
  { key: "formalize", labelAr: "اجعله رسمياً", labelEn: "Formal tone", icon: Briefcase },
  { key: "friendly", labelAr: "اجعله ودوداً", labelEn: "Friendly tone", icon: Smile },
  { key: "translate_ar", labelAr: "ترجم للعربية", labelEn: "Translate → AR", icon: Languages },
  { key: "translate_en", labelAr: "ترجم للإنجليزية", labelEn: "Translate → EN", icon: Languages },
  { key: "summarize", labelAr: "لخّص", labelEn: "Summarize", icon: FileText },
];

interface Props {
  value: string;
  onChange: (next: string) => void;
  actions?: Action[];
  className?: string;
  size?: "sm" | "md";
  triggerLabel?: string;
}

const STORAGE_KEY = "nawa_token";

async function callAi(action: Action, text: string, context?: string): Promise<string> {
  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) || "" : "";
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  const r = await fetch(`${base}/api/ai/text-action`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ action, text, context }),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.error || `HTTP ${r.status}`);
  }
  const data = await r.json();
  return data.result || "";
}

export function AIWriteAssist({ value, onChange, actions, className, size = "sm", triggerLabel }: Props) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const ar = language === "ar";
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<Action | null>(null);
  const allowed = actions ? ALL_ACTIONS.filter(a => actions.includes(a.key)) : ALL_ACTIONS;

  const run = async (action: Action) => {
    const text = (value || "").trim();
    if (!text) {
      toast({ title: ar ? "النص فارغ" : "Empty text", description: ar ? "اكتب شيئاً أولاً" : "Type something first", variant: "destructive" });
      return;
    }
    setBusy(action);
    try {
      const result = await callAi(action, text);
      if (result) {
        onChange(result);
        setOpen(false);
        toast({ title: ar ? "تم بالذكاء الاصطناعي ✨" : "AI applied ✨" });
      } else {
        throw new Error("Empty result");
      }
    } catch (e: any) {
      toast({ title: ar ? "فشل الذكاء الاصطناعي" : "AI failed", description: e?.message || "", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={size === "sm" ? "sm" : "default"}
          className={`gap-1.5 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary ${className || ""}`}
          disabled={!!busy}
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          <span className="text-xs font-medium">{triggerLabel || (ar ? "ذكاء اصطناعي" : "AI Assist")}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2" dir={ar ? "rtl" : "ltr"}>
        <div className="text-xs text-muted-foreground px-2 py-1.5 font-medium">
          {ar ? "اختر إجراءً ذكياً" : "Choose an AI action"}
        </div>
        <div className="grid gap-0.5">
          {allowed.map(a => {
            const Icon = a.icon;
            return (
              <button
                key={a.key}
                type="button"
                onClick={() => run(a.key)}
                disabled={!!busy}
                className="flex items-center gap-2.5 px-2 py-2 rounded-md text-sm hover:bg-primary/10 disabled:opacity-50 disabled:cursor-wait text-start transition-colors"
              >
                {busy === a.key ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Icon className="w-4 h-4 text-primary" />}
                <span>{ar ? a.labelAr : a.labelEn}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// One-shot helper for non-component callers (e.g., generating smart-reply from email body)
export async function aiSmartReply(emailBody: string, intent?: string): Promise<string> {
  return callAi("smart_reply", emailBody, intent);
}
export async function aiSummarize(text: string): Promise<string> {
  return callAi("summarize", text);
}
export async function aiTextAction(action: Action, text: string, context?: string): Promise<string> {
  return callAi(action, text, context);
}

export { Reply };
