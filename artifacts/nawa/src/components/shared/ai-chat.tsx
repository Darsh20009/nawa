import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useAiChat } from "@workspace/api-client-react";
import {
  Bot, Send, User, Sparkles, Brain, FileText, Mail,
  TrendingUp, Zap, Copy, Check, Volume2, VolumeX,
  ChevronDown, RotateCcw, Search, Newspaper, Briefcase,
  CheckCircle2, AlertCircle, BarChart3, Inbox, ExternalLink,
  Building2, Users, MessageSquare, Wrench, Settings, Trash2,
  Pencil, ListChecks, UserPlus, Reply, Crown
} from "lucide-react";

const TOOL_META: Record<string, { icon: any; labelAr: string; labelEn: string; color: string }> = {
  // Projects
  create_project:             { icon: Building2,    labelAr: "إنشاء مشروع",      labelEn: "Create Project",    color: "emerald" },
  update_project:             { icon: Pencil,       labelAr: "تعديل مشروع",      labelEn: "Update Project",    color: "amber" },
  delete_project:             { icon: Trash2,       labelAr: "حذف مشروع",        labelEn: "Delete Project",    color: "rose" },
  list_projects:              { icon: ListChecks,   labelAr: "قائمة المشاريع",   labelEn: "List Projects",     color: "indigo" },
  // News
  publish_news:               { icon: Newspaper,    labelAr: "نشر خبر",         labelEn: "Publish News",      color: "emerald" },
  update_news:                { icon: Pencil,       labelAr: "تعديل خبر",        labelEn: "Update News",       color: "amber" },
  delete_news:                { icon: Trash2,       labelAr: "حذف خبر",          labelEn: "Delete News",       color: "rose" },
  list_news:                  { icon: ListChecks,   labelAr: "قائمة الأخبار",    labelEn: "List News",         color: "indigo" },
  // Jobs
  publish_job:                { icon: Briefcase,    labelAr: "نشر وظيفة",       labelEn: "Publish Job",       color: "blue" },
  update_job:                 { icon: Pencil,       labelAr: "تعديل وظيفة",      labelEn: "Update Job",        color: "amber" },
  delete_job:                 { icon: Trash2,       labelAr: "حذف وظيفة",        labelEn: "Delete Job",        color: "rose" },
  list_jobs:                  { icon: ListChecks,   labelAr: "قائمة الوظائف",    labelEn: "List Jobs",         color: "indigo" },
  list_applications:          { icon: ListChecks,   labelAr: "طلبات التوظيف",    labelEn: "Applications",      color: "indigo" },
  update_application_status:  { icon: CheckCircle2, labelAr: "تحديث طلب",        labelEn: "Update Application",color: "amber" },
  // Brokers
  create_broker:              { icon: UserPlus,     labelAr: "إضافة وسيط",       labelEn: "Create Broker",     color: "emerald" },
  update_broker:              { icon: Pencil,       labelAr: "تعديل وسيط",       labelEn: "Update Broker",     color: "amber" },
  delete_broker:              { icon: Trash2,       labelAr: "حذف وسيط",         labelEn: "Delete Broker",     color: "rose" },
  list_brokers:               { icon: Users,        labelAr: "قائمة الوسطاء",    labelEn: "List Brokers",      color: "indigo" },
  // Messages
  list_messages:              { icon: Inbox,        labelAr: "قائمة الرسائل",    labelEn: "List Messages",     color: "indigo" },
  update_message:             { icon: Pencil,       labelAr: "تحديث رسالة",      labelEn: "Update Message",    color: "amber" },
  delete_message:             { icon: Trash2,       labelAr: "حذف رسالة",        labelEn: "Delete Message",    color: "rose" },
  reply_to_message:           { icon: Reply,        labelAr: "الرد على رسالة",   labelEn: "Reply to Message",  color: "purple" },
  // Employees
  create_employee:            { icon: UserPlus,     labelAr: "إضافة موظف",       labelEn: "Create Employee",   color: "emerald" },
  update_employee:            { icon: Pencil,       labelAr: "تعديل موظف",       labelEn: "Update Employee",   color: "amber" },
  delete_employee:            { icon: Trash2,       labelAr: "حذف موظف",         labelEn: "Delete Employee",   color: "rose" },
  list_employees:             { icon: Users,        labelAr: "قائمة الموظفين",   labelEn: "List Employees",    color: "indigo" },
  // Services
  create_service:             { icon: Wrench,       labelAr: "إنشاء خدمة",       labelEn: "Create Service",    color: "emerald" },
  update_service:             { icon: Pencil,       labelAr: "تعديل خدمة",       labelEn: "Update Service",    color: "amber" },
  delete_service:             { icon: Trash2,       labelAr: "حذف خدمة",         labelEn: "Delete Service",    color: "rose" },
  list_services:              { icon: ListChecks,   labelAr: "قائمة الخدمات",    labelEn: "List Services",     color: "indigo" },
  // Settings + utility
  update_site_settings:       { icon: Settings,     labelAr: "إعدادات الموقع",   labelEn: "Site Settings",     color: "purple" },
  universal_search:           { icon: Search,       labelAr: "بحث شامل",         labelEn: "Universal Search",  color: "indigo" },
  send_email:                 { icon: Mail,         labelAr: "إرسال بريد",       labelEn: "Send Email",        color: "purple" },
  review_pending_tasks:       { icon: Inbox,        labelAr: "مراجعة المهام",    labelEn: "Review Tasks",      color: "amber" },
  get_dashboard_stats:        { icon: BarChart3,    labelAr: "إحصائيات",        labelEn: "Stats",             color: "indigo" },
  draft_project_description:  { icon: FileText,     labelAr: "صياغة وصف",       labelEn: "Draft Description", color: "slate" },
  analyze_market:             { icon: TrendingUp,   labelAr: "تحليل سوق",       labelEn: "Market Analysis",   color: "rose" },
};
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { isSoundEnabled, setSoundEnabled, playSuccess } from "@/lib/sounds";

interface ToolCallResult {
  toolName: string;
  args: any;
  ok?: boolean;
  result?: any;
  error?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCallResult[];
  timestamp: Date;
}

const QUICK_PROMPTS = {
  ar: [
    { icon: Building2,  label: "🚀 أنشئ مشروع كامل", prompt: "أنشئ مشروعاً سكنياً فاخراً جديداً في حي الياسمين بالرياض: 120 وحدة، نمط فيلات حديثة، حالة 'تخطيط'، اقترح اسماً مبدعاً ووصفاً تسويقياً قوياً بالعربي والإنجليزي وعلّمه featured." },
    { icon: Newspaper,  label: "📰 إعلان إطلاق",     prompt: "اكتب وانشر خبراً صحفياً عن إطلاق المرحلة الثانية من مشاريعنا السكنية في الرياض — افتح بجملة قوية، اذكر الأرقام، واختم بدعوة للاستثمار." },
    { icon: Inbox,      label: "📥 ملخص اليوم",      prompt: "راجع كل الرسائل غير المقروءة والطلبات المعلقة وأعطني ملخصاً تنفيذياً مع توصياتك الفورية لكل بند." },
    { icon: Reply,      label: "✉️ رد على عميل",     prompt: "اجلب آخر 5 رسائل غير مقروءة من العملاء، رد على كل واحدة بإيميل احترافي مخصص، وعلّمها 'replied'." },
    { icon: UserPlus,   label: "👨‍💼 وظّف موظف",      prompt: "أنشئ حساب موظف جديد: محمد العتيبي — دور 'sales'، قسم 'المبيعات'، كلمة سر مؤقتة قوية." },
    { icon: Briefcase,  label: "💼 افتح 3 وظائف",    prompt: "افتح 3 وظائف جديدة بالتوازي: مدير تطوير أعمال، مهندس مدني، مسؤول تسويق رقمي — مع وصف ومتطلبات احترافية لكل وظيفة." },
    { icon: Search,     label: "🔍 بحث شامل",         prompt: "ابحث في كل أنحاء المنصة عن أي ذكر لكلمة 'الياسمين' (مشاريع، أخبار، رسائل، وسطاء) واعرض النتائج مرتبة." },
    { icon: Settings,   label: "⚙️ حدّث بيانات الموقع", prompt: "حدّث رقم الواتساب إلى +966500073509 ورابط الانستقرام إلى @nawainvsa." },
    { icon: BarChart3,  label: "📊 لوحة الأرقام",     prompt: "أعطني إحصائيات حية شاملة (مشاريع، أخبار، وسطاء، موظفين، رسائل غير مقروءة) في جدول مرتب." },
    { icon: TrendingUp, label: "📈 تحليل سوق",        prompt: "حلل سوق العقار السكني في الرياض لعام 2026 — اتجاهات، فرص استثمارية، مخاطر، وتوصيات لنوى." },
  ],
  en: [
    { icon: Building2,  label: "🚀 Full Project",     prompt: "Create a luxury residential project in Al Yasmin, Riyadh: 120 units, modern villa style, status 'planning'. Invent a creative name + powerful bilingual marketing description and mark it as featured." },
    { icon: Newspaper,  label: "📰 Launch News",      prompt: "Write and publish a press release about launching Phase 2 of our Riyadh residential projects — strong opening, real numbers, investment CTA." },
    { icon: Inbox,      label: "📥 Daily Brief",      prompt: "Review all unread messages and pending tasks. Give me an executive brief with your instant recommendation per item." },
    { icon: Reply,      label: "✉️ Reply to Clients", prompt: "Fetch the 5 most recent unread client messages, reply to each with a personalized professional email, and mark them 'replied'." },
    { icon: UserPlus,   label: "👨‍💼 Hire Employee",   prompt: "Create a new employee: Mohammed Al-Otaibi — role 'sales', department 'Sales', strong temp password." },
    { icon: Briefcase,  label: "💼 Open 3 Jobs",      prompt: "Open 3 jobs in parallel: BD Manager, Civil Engineer, Digital Marketer — with full bilingual description & requirements." },
    { icon: Search,     label: "🔍 Universal Search", prompt: "Search the entire platform for 'Yasmin' (projects, news, messages, brokers) and present sorted results." },
    { icon: Settings,   label: "⚙️ Update Site Info", prompt: "Update WhatsApp to +966500073509 and Instagram link to @nawainvsa." },
    { icon: BarChart3,  label: "📊 Live Stats",       prompt: "Give me live platform statistics (projects, news, brokers, employees, unread messages) in a clean table." },
    { icon: TrendingUp, label: "📈 Market Analysis",  prompt: "Analyze the Riyadh residential real estate market for 2026 — trends, opportunities, risks, and recommendations for Nawa." },
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
      <div className="shrink-0 px-5 py-3.5 border-b border-border bg-gradient-to-l from-[#0D1B3E] via-[#102046] to-[#0D1B3E] text-white flex items-center justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #C9A96E 0%, transparent 40%)" }} />
        <div className="flex items-center gap-3 relative z-10">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-[#C9A96E]/40 shadow-lg shadow-[#C9A96E]/10">
              <img src="/logo-transparent.png" alt="Nawa" className="w-9 h-9 object-contain brightness-0 invert" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0D1B3E] shadow shadow-emerald-400/50 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-sm tracking-wide">{isAr ? "نوى AI" : "Nawa AI"}</h2>
              <span className="text-[10px] bg-gradient-to-r from-[#C9A96E] to-[#d4b888] text-[#0D1B3E] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                {isAr ? "ايجنت إبداعي" : "Creative Agent"}
              </span>
            </div>
            <p className="text-[11px] text-white/60 flex items-center gap-1.5 mt-0.5">
              <Zap className="w-3 h-3 text-[#C9A96E]" />
              {isAr ? "ينشر · يرسل بريد · يراجع المهام · يحلّل" : "Publish · Email · Review · Analyze"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 relative z-10">
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

                {/* Tool execution result cards */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="flex flex-col gap-2 w-full max-w-md">
                    {msg.toolCalls.map((tc, ti) => {
                      const meta = TOOL_META[tc.toolName] || { icon: Zap, labelAr: tc.toolName, labelEn: tc.toolName, color: "slate" };
                      const Icon = meta.icon;
                      const ok = tc.ok !== false;
                      return (
                        <div key={ti} className={cn(
                          "rounded-xl border px-3 py-2.5 text-xs shadow-sm transition-all",
                          ok ? "bg-gradient-to-l from-[#0D1B3E]/[0.03] to-white border-[#C9A96E]/30"
                             : "bg-red-50/50 border-red-200"
                        )}>
                          <div className="flex items-center gap-2 mb-1">
                            <div className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                              ok ? "bg-[#C9A96E]/15 text-[#0D1B3E]" : "bg-red-100 text-red-600"
                            )}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-[#0D1B3E] text-[11px]">
                                {isAr ? meta.labelAr : meta.labelEn}
                              </div>
                              <div className="flex items-center gap-1 text-[10px]">
                                {ok ? (
                                  <><CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /><span className="text-emerald-600">{isAr ? "نُفّذ بنجاح" : "Executed"}</span></>
                                ) : (
                                  <><AlertCircle className="w-2.5 h-2.5 text-red-500" /><span className="text-red-500">{tc.error || (isAr ? "فشل" : "Failed")}</span></>
                                )}
                              </div>
                            </div>
                            {ok && tc.result?.id && (tc.toolName === "publish_news" || tc.toolName === "publish_job") && (
                              <a
                                href={tc.toolName === "publish_news" ? `/admin/news` : `/admin/jobs`}
                                className="text-[10px] flex items-center gap-1 text-[#0D1B3E] hover:text-[#C9A96E] font-medium"
                              >
                                {isAr ? "عرض" : "View"} <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                          {ok && tc.result && typeof tc.result === "object" && (
                            <div className="text-[10px] text-muted-foreground bg-white/50 rounded px-2 py-1 mt-1 font-mono break-all">
                              {tc.toolName === "send_email" && tc.result?.to && `→ ${tc.result.to} (من ${tc.result?.from || "info@"})`}
                              {tc.toolName === "publish_news" && tc.result?.id != null && `#${tc.result.id} — ${tc.result?.title ?? ""}`}
                              {tc.toolName === "publish_job" && tc.result?.id != null && `#${tc.result.id} — ${tc.result?.title ?? ""}`}
                              {tc.toolName === "get_dashboard_stats" && `📊 ${tc.result?.projects ?? 0} مشروع · ${tc.result?.unreadMessages ?? 0} رسالة جديدة · ${tc.result?.jobs ?? 0} وظيفة`}
                              {tc.toolName === "review_pending_tasks" && `📥 ${tc.result?.unreadMessages ?? 0} رسالة غير مقروءة`}
                            </div>
                          )}
                        </div>
                      );
                    })}
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
