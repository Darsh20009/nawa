import { useState } from "react";
import { Sparkles, Loader2, RefreshCw, Lightbulb, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import { aiTextAction } from "@/components/shared/ai-write-assist";
import { motion } from "framer-motion";

interface Props {
  stats: any;
}

export function AIInsightsWidget({ stats }: Props) {
  const { language } = useLanguage();
  const ar = language === "ar";
  const [insights, setInsights] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");

  const generate = async () => {
    if (!stats) return;
    setBusy(true);
    setError("");
    try {
      const summary = ar
        ? `بيانات لوحة قيادة شركة نوى العقارية اليوم:
- إجمالي المشاريع: ${stats.totalProjects ?? 0}
- المشاريع المميزة: ${stats.featuredProjects ?? 0}
- الوسطاء المعتمدون: ${stats.totalBrokers ?? 0}
- إجمالي الموظفين: ${stats.totalEmployees ?? 0}
- الوظائف النشطة: ${stats.activeJobs ?? stats.totalJobs ?? 0}
- إجمالي رسائل العملاء: ${stats.totalMessages ?? 0}
- رسائل جديدة بانتظار الرد: ${stats.newMessages ?? 0}`
        : `Nawa Real Estate dashboard data today:
- Total projects: ${stats.totalProjects ?? 0}
- Featured projects: ${stats.featuredProjects ?? 0}
- Certified brokers: ${stats.totalBrokers ?? 0}
- Total employees: ${stats.totalEmployees ?? 0}
- Active jobs: ${stats.activeJobs ?? stats.totalJobs ?? 0}
- Total client messages: ${stats.totalMessages ?? 0}
- New messages waiting reply: ${stats.newMessages ?? 0}`;

      const context = ar
        ? "أنت مستشار أعمال خبير في القطاع العقاري السعودي. حلّل هذه البيانات وقدّم 3 رؤى عملية موجزة (كل رؤية في سطر واحد) باللغة العربية: أهم نقطة قوة، أهم تحذير، وإجراء مقترح فوري. استخدم لغة تنفيذية واضحة بدون مقدمات."
        : "You are an executive advisor for Saudi real estate. Analyze this data and provide 3 concise actionable insights (one per line) in English: top strength, top warning, suggested immediate action. Be direct, no preamble.";

      const result = await aiTextAction("summarize", summary, context);
      setInsights(result);
    } catch (e: any) {
      setError(e?.message || (ar ? "فشل توليد الرؤى" : "Failed to generate insights"));
    } finally {
      setBusy(false);
    }
  };

  const lines = insights.split("\n").map(l => l.trim()).filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-[#1a2f6e] rounded-2xl p-6 text-white shadow-lg"
    >
      {/* Animated background sparkles */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-4 right-6 animate-pulse"><Sparkles className="w-6 h-6" /></div>
        <div className="absolute top-12 left-12 animate-pulse" style={{ animationDelay: "0.5s" }}><Sparkles className="w-4 h-4" /></div>
        <div className="absolute bottom-8 right-16 animate-pulse" style={{ animationDelay: "1s" }}><Sparkles className="w-5 h-5" /></div>
      </div>

      <div className="relative">
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 backdrop-blur rounded-xl flex items-center justify-center ring-1 ring-white/20">
              <Lightbulb className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h3 className="font-bold font-serif text-base">{ar ? "رؤى نوى مي" : "Nawa Me Insights"}</h3>
              <p className="text-white/60 text-xs">{ar ? "تحليل لحظي لأداء أعمالك" : "Live business intelligence"}</p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 text-xs gap-1.5 text-white/90 hover:text-white hover:bg-white/10 border border-white/20"
            onClick={generate}
            disabled={busy}
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : insights ? <RefreshCw className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            {busy ? (ar ? "تحليل..." : "Analyzing...") : insights ? (ar ? "حدّث" : "Refresh") : (ar ? "ولّد الرؤى" : "Generate")}
          </Button>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-500/20 border border-red-300/30 rounded-lg p-3 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!insights && !busy && !error && (
          <div className="text-white/70 text-sm leading-relaxed py-3">
            {ar
              ? "اضغط (ولّد الرؤى) ليقوم الذكاء الاصطناعي بتحليل بيانات أعمالك واقتراح خطوات عملية لتحسين أدائك."
              : "Click (Generate) to let AI analyze your business data and suggest practical next steps."}
          </div>
        )}

        {busy && (
          <div className="space-y-2 py-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-3 bg-white/10 rounded animate-pulse" style={{ width: `${85 - i * 10}%` }} />
            ))}
          </div>
        )}

        {insights && !busy && (
          <ul className="space-y-2.5 mt-2">
            {lines.map((line, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: ar ? 8 : -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-2.5 text-sm leading-relaxed"
              >
                <TrendingUp className="w-3.5 h-3.5 text-secondary mt-1 shrink-0" />
                <span className="text-white/90">{line.replace(/^[-•*\d.)\s]+/, "")}</span>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}
