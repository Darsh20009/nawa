import { useEffect, useState, useCallback } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Sparkles, MessageSquare, Mail, FileText, Bot, Globe, Tag, ThumbsUp, ThumbsDown, BookOpen, Search, Loader2, Trash2, RefreshCw, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConvItem {
  id: string;
  channel: string;
  action: string | null;
  userId: string | null;
  userName: string | null;
  userRole: string | null;
  visitorIp: string | null;
  inputPreview: string;
  outputPreview: string;
  rating: "good" | "bad" | null;
  durationMs: number;
  model: string | null;
  createdAt: string;
}

interface ConvDetail extends ConvItem {
  messages: Array<{ role: string; content: string; at: string }>;
  reviewedBy: string | null;
  reviewNote: string | null;
}

interface Learning {
  id: string;
  question: string;
  answer: string;
  channel: string;
  tags: string[];
  approvedBy: string;
  enabled: boolean;
  useCount: number;
  createdAt: string;
}

const CHANNELS: Record<string, { ar: string; en: string; icon: any; color: string }> = {
  "public-chat": { ar: "شات الزوار", en: "Visitor Chat", icon: Globe, color: "bg-blue-500/10 text-blue-700 border-blue-200" },
  "employee-chat": { ar: "مساعد الموظفين", en: "Staff Assistant", icon: Bot, color: "bg-purple-500/10 text-purple-700 border-purple-200" },
  "text-action": { ar: "تحسين النصوص", en: "Text Action", icon: Sparkles, color: "bg-amber-500/10 text-amber-700 border-amber-200" },
  "smart-reply": { ar: "رد ذكي", en: "Smart Reply", icon: Mail, color: "bg-emerald-500/10 text-emerald-700 border-emerald-200" },
  "summarize": { ar: "تلخيص", en: "Summarize", icon: FileText, color: "bg-cyan-500/10 text-cyan-700 border-cyan-200" },
  "classify": { ar: "تصنيف رسائل", en: "Classify", icon: Tag, color: "bg-pink-500/10 text-pink-700 border-pink-200" },
  "auto-reply": { ar: "رد تلقائي", en: "Auto-reply", icon: MessageSquare, color: "bg-indigo-500/10 text-indigo-700 border-indigo-200" },
};

const STORAGE_KEY = "nawa_token";
function authHeaders(): Record<string, string> {
  const t = localStorage.getItem(STORAGE_KEY) || "";
  return { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}
const API_BASE = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");

export default function AdminAiConversations() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const ar = language === "ar";

  const [tab, setTab] = useState<"conversations" | "learnings">("conversations");
  const [items, setItems] = useState<ConvItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<{ total: number; byChannel: Record<string, number> }>({ total: 0, byChannel: {} });
  const [detail, setDetail] = useState<ConvDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [savingLearning, setSavingLearning] = useState(false);

  const [learnings, setLearnings] = useState<Learning[]>([]);
  const [learningsLoading, setLearningsLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "25" });
      if (channel !== "all") params.set("channel", channel);
      if (search.trim()) params.set("search", search.trim());
      const r = await fetch(`${API_BASE}/api/ai/conversations?${params}`, { headers: authHeaders() });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Load failed");
      setItems(data.items || []);
      setTotal(data.total || 0);
      setStats(data.stats || { total: 0, byChannel: {} });
    } catch (e: any) {
      toast({ title: ar ? "فشل التحميل" : "Failed to load", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  }, [channel, search, page, ar, toast]);

  const loadLearnings = useCallback(async () => {
    setLearningsLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/ai/learnings`, { headers: authHeaders() });
      const data = await r.json();
      setLearnings(data.items || []);
    } catch {} finally { setLearningsLoading(false); }
  }, []);

  useEffect(() => { if (tab === "conversations") load(); }, [load, tab]);
  useEffect(() => { if (tab === "learnings") loadLearnings(); }, [loadLearnings, tab]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setDetail({ id } as any);
    try {
      const r = await fetch(`${API_BASE}/api/ai/conversations/${id}`, { headers: authHeaders() });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Load failed");
      setDetail(data);
    } catch (e: any) {
      toast({ title: ar ? "فشل" : "Failed", description: e.message, variant: "destructive" });
      setDetail(null);
    } finally { setDetailLoading(false); }
  };

  const rate = async (id: string, rating: "good" | "bad" | null) => {
    try {
      const r = await fetch(`${API_BASE}/api/ai/conversations/${id}/rate`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify({ rating }),
      });
      if (!r.ok) throw new Error();
      setItems(its => its.map(x => x.id === id ? { ...x, rating } : x));
      if (detail?.id === id) setDetail(d => d ? { ...d, rating } : d);
      toast({ title: ar ? "تم التقييم" : "Rated" });
    } catch { toast({ title: ar ? "فشل" : "Failed", variant: "destructive" }); }
  };

  const saveAsLearning = async () => {
    if (!detail) return;
    const userMsg = detail.messages.find(m => m.role === "user");
    const aiMsg = [...detail.messages].reverse().find(m => m.role === "assistant");
    if (!userMsg || !aiMsg) {
      toast({ title: ar ? "لا توجد محادثة قابلة للحفظ" : "No saveable Q&A", variant: "destructive" }); return;
    }
    setSavingLearning(true);
    try {
      const r = await fetch(`${API_BASE}/api/ai/learnings`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({
          question: userMsg.content,
          answer: aiMsg.content,
          channel: detail.channel,
          sourceConversationId: detail.id,
        }),
      });
      if (!r.ok) throw new Error();
      toast({ title: ar ? "تم الحفظ كمعرفة ✨ سيتعلم منه الذكاء" : "Saved as learning ✨ AI will use it" });
      await rate(detail.id, "good");
    } catch (e: any) {
      toast({ title: ar ? "فشل الحفظ" : "Save failed", variant: "destructive" });
    } finally { setSavingLearning(false); }
  };

  const deleteConv = async (id: string) => {
    if (!confirm(ar ? "حذف هذه المحادثة نهائياً؟" : "Delete this conversation permanently?")) return;
    try {
      const r = await fetch(`${API_BASE}/api/ai/conversations/${id}`, { method: "DELETE", headers: authHeaders() });
      if (!r.ok) throw new Error();
      setItems(its => its.filter(x => x.id !== id));
      if (detail?.id === id) setDetail(null);
      toast({ title: ar ? "تم الحذف" : "Deleted" });
    } catch { toast({ title: ar ? "فشل" : "Failed", variant: "destructive" }); }
  };

  const toggleLearning = async (id: string, enabled: boolean) => {
    try {
      const r = await fetch(`${API_BASE}/api/ai/learnings/${id}`, {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify({ enabled }),
      });
      if (!r.ok) throw new Error();
      setLearnings(ls => ls.map(l => l.id === id ? { ...l, enabled } : l));
    } catch { toast({ title: ar ? "فشل" : "Failed", variant: "destructive" }); }
  };

  const deleteLearning = async (id: string) => {
    if (!confirm(ar ? "حذف هذا التعلم؟" : "Delete this learning?")) return;
    try {
      const r = await fetch(`${API_BASE}/api/ai/learnings/${id}`, { method: "DELETE", headers: authHeaders() });
      if (!r.ok) throw new Error();
      setLearnings(ls => ls.filter(l => l.id !== id));
    } catch { toast({ title: ar ? "فشل" : "Failed", variant: "destructive" }); }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-5" dir={ar ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          {ar ? "محادثات الذكاء الاصطناعي" : "AI Conversations"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          {ar
            ? "كل محادثات الذكاء في مكان واحد. قيّم الردود الجيدة لكي يتعلم منها المساعد."
            : "All AI interactions in one place. Rate good responses so the assistant learns from them."}
        </p>
      </div>

      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setTab("conversations")}
          className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
            tab === "conversations" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
        >
          {ar ? "المحادثات" : "Conversations"} ({stats.total || 0})
        </button>
        <button
          onClick={() => setTab("learnings")}
          className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
            tab === "learnings" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
        >
          <BookOpen className="w-3.5 h-3.5 inline-block me-1.5 -mt-0.5" />
          {ar ? "قاعدة التعلّم" : "Learnings"} ({learnings.length})
        </button>
      </div>

      {tab === "conversations" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {Object.entries(CHANNELS).map(([k, v]) => {
              const Icon = v.icon;
              const count = stats.byChannel[k] || 0;
              return (
                <button
                  key={k}
                  onClick={() => { setChannel(channel === k ? "all" : k); setPage(1); }}
                  className={cn(
                    "p-3 rounded-xl border text-start transition-all",
                    channel === k ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/40",
                  )}
                >
                  <Icon className="w-4 h-4 text-primary mb-1.5" />
                  <div className="text-xs text-muted-foreground leading-tight">{ar ? v.ar : v.en}</div>
                  <div className="text-lg font-bold">{count}</div>
                </button>
              );
            })}
          </div>

          {/* Filters */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
              <Input
                placeholder={ar ? "ابحث في النصوص..." : "Search messages..."}
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="ps-9"
              />
            </div>
            <Select value={channel} onValueChange={(v) => { setChannel(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{ar ? "كل القنوات" : "All channels"}</SelectItem>
                {Object.entries(CHANNELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{ar ? v.ar : v.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={load} disabled={loading}>
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>

          {/* List */}
          <div className="border border-border rounded-xl bg-card overflow-hidden">
            {loading ? (
              <div className="p-12 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto opacity-20 mb-3" />
                <p>{ar ? "لا توجد محادثات بعد" : "No conversations yet"}</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {items.map(item => {
                  const ch = CHANNELS[item.channel] || CHANNELS["text-action"];
                  const Icon = ch.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => openDetail(item.id)}
                      className="w-full p-4 hover:bg-muted/50 transition-colors text-start group"
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("w-9 h-9 rounded-lg border flex items-center justify-center shrink-0", ch.color)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-semibold">{ar ? ch.ar : ch.en}</span>
                            {item.action && <Badge variant="outline" className="text-[10px] h-4 px-1.5">{item.action}</Badge>}
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground truncate">
                              {item.userName || item.visitorIp || (ar ? "زائر" : "Visitor")}
                            </span>
                            {item.rating === "good" && <ThumbsUp className="w-3 h-3 text-green-600" />}
                            {item.rating === "bad" && <ThumbsDown className="w-3 h-3 text-red-600" />}
                            <span className="text-xs text-muted-foreground ms-auto">
                              {new Date(item.createdAt).toLocaleString(ar ? "ar-SA" : "en-US", { dateStyle: "short", timeStyle: "short" })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground line-clamp-1">
                            <span className="text-muted-foreground">{ar ? "س:" : "Q:"}</span> {item.inputPreview || "—"}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                            <span>{ar ? "ج:" : "A:"}</span> {item.outputPreview || "—"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {total > 25 && (
              <div className="p-3 border-t border-border flex items-center justify-between">
                <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  {ar ? "السابق" : "Previous"}
                </Button>
                <span className="text-xs text-muted-foreground">{page} / {Math.ceil(total / 25)}</span>
                <Button variant="ghost" size="sm" disabled={page * 25 >= total} onClick={() => setPage(p => p + 1)}>
                  {ar ? "التالي" : "Next"}
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {tab === "learnings" && (
        <div className="border border-border rounded-xl bg-card overflow-hidden">
          {learningsLoading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : learnings.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto opacity-20 mb-3" />
              <p className="font-medium">{ar ? "لا توجد معرفة محفوظة بعد" : "No learnings saved yet"}</p>
              <p className="text-sm mt-2 max-w-md mx-auto">
                {ar
                  ? "افتح أي محادثة جيدة وانقر «احفظ كمعرفة» — سيتعلم الذكاء منها ويستخدمها في الردود المستقبلية."
                  : "Open any good conversation and click 'Save as learning' — the AI will use it in future responses."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {learnings.map(l => (
                <div key={l.id} className={cn("p-4 transition-opacity", !l.enabled && "opacity-50")}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5">{l.channel}</Badge>
                        <span className="text-xs text-muted-foreground">{ar ? "استُخدم" : "used"} {l.useCount}×</span>
                        <span className="text-xs text-muted-foreground ms-auto">
                          {new Date(l.createdAt).toLocaleDateString(ar ? "ar-SA" : "en-US")}
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-1">{ar ? "س: " : "Q: "}{l.question}</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ar ? "ج: " : "A: "}{l.answer}</p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => toggleLearning(l.id, !l.enabled)}>
                        {l.enabled ? (ar ? "إيقاف" : "Disable") : (ar ? "تفعيل" : "Enable")}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => deleteLearning(l.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detail} onOpenChange={(v) => { if (!v) setDetail(null); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0" dir={ar ? "rtl" : "ltr"}>
          <DialogHeader className="px-6 pt-6 pb-3 border-b border-border">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {ar ? "تفاصيل المحادثة" : "Conversation detail"}
            </DialogTitle>
          </DialogHeader>

          {detailLoading || !detail?.messages ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : detail ? (
            <>
              <div className="px-6 py-3 border-b border-border bg-muted/30 flex items-center gap-3 flex-wrap text-xs">
                <Badge variant="outline">{ar ? CHANNELS[detail.channel]?.ar : CHANNELS[detail.channel]?.en}</Badge>
                {detail.action && <Badge variant="secondary">{detail.action}</Badge>}
                <span className="text-muted-foreground">
                  {detail.userName || detail.visitorIp || (ar ? "زائر مجهول" : "Anonymous visitor")}
                </span>
                {detail.userRole && <span className="text-muted-foreground">· {detail.userRole}</span>}
                {detail.model && <span className="text-muted-foreground">· {detail.model}</span>}
                {detail.durationMs > 0 && <span className="text-muted-foreground">· {(detail.durationMs / 1000).toFixed(1)}s</span>}
              </div>

              <ScrollArea className="flex-1 px-6 py-4">
                <div className="space-y-3">
                  {detail.messages?.filter(m => m.role !== "system").map((m, i) => (
                    <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed",
                        m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                      )}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="px-6 py-3 border-t border-border bg-muted/30 flex flex-wrap gap-2 items-center">
                <Button
                  variant={detail.rating === "good" ? "default" : "outline"}
                  size="sm" className="gap-1.5"
                  onClick={() => rate(detail.id, detail.rating === "good" ? null : "good")}
                >
                  <ThumbsUp className="w-3.5 h-3.5" /> {ar ? "جيد" : "Good"}
                </Button>
                <Button
                  variant={detail.rating === "bad" ? "destructive" : "outline"}
                  size="sm" className="gap-1.5"
                  onClick={() => rate(detail.id, detail.rating === "bad" ? null : "bad")}
                >
                  <ThumbsDown className="w-3.5 h-3.5" /> {ar ? "ضعيف" : "Bad"}
                </Button>
                <Button
                  size="sm" className="gap-1.5 bg-amber-600 hover:bg-amber-700"
                  onClick={saveAsLearning}
                  disabled={savingLearning}
                >
                  {savingLearning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookOpen className="w-3.5 h-3.5" />}
                  {ar ? "احفظ كمعرفة" : "Save as learning"}
                </Button>
                <div className="ms-auto flex gap-2">
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive gap-1.5" onClick={() => deleteConv(detail.id)}>
                    <Trash2 className="w-3.5 h-3.5" /> {ar ? "حذف" : "Delete"}
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
