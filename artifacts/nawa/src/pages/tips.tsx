import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, Copy, Check, Eye, EyeOff, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const logoPath = "/logo-transparent.png";
const TIPS_PASSWORD = "12345678";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="ml-2 text-[#C9A96E] hover:text-white transition-colors shrink-0">
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-sm font-bold text-[#C9A96E] border-b border-[#C9A96E]/30 pb-2 mb-4 uppercase tracking-widest">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 border-b border-white/5 gap-1">
      <span className="text-white/50 text-xs min-w-[200px]">{label}</span>
      <span className={`text-white/90 text-xs flex items-center gap-1 ${mono ? "font-mono bg-white/5 px-2.5 py-1 rounded-lg" : ""}`}>
        {value}
        <CopyButton text={value} />
      </span>
    </div>
  );
}

function StatusBadge({ color, text }: { color: string; text: string }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${color}`}>{text}</span>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-white/5 border border-white/8 rounded-xl p-4 hover:border-[#C9A96E]/30 transition-colors">
      <div className="text-xl mb-2">{icon}</div>
      <h4 className="font-bold text-white mb-1 text-sm">{title}</h4>
      <p className="text-white/45 text-xs leading-relaxed">{desc}</p>
    </div>
  );
}

export default function Tips() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { toast } = useToast();

  const handleUnlock = () => {
    if (password === TIPS_PASSWORD) {
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
      toast({ variant: "destructive", title: "كلمة المرور خاطئة", description: "حاول مجدداً" });
    }
  };

  return (
    <div className="min-h-screen bg-[#070f20] text-white" dir="rtl">
      <div className="container mx-auto px-4 py-12 max-w-3xl">

        {/* Header */}
        <div className="text-center mb-10">
          <img
            src={logoPath}
            alt="نوى العقارية"
            className="h-12 mx-auto mb-6 brightness-0 invert opacity-80"
          />
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0D1B3E] border border-[#C9A96E]/40 mb-4">
            {unlocked
              ? <Unlock className="w-7 h-7 text-[#C9A96E]" />
              : <Lock className="w-7 h-7 text-[#C9A96E]" />}
          </div>
          <h1 className="text-2xl font-bold text-white mb-1.5 font-mono">دليل النظام الكامل</h1>
          <p className="text-white/35 text-xs tracking-widest uppercase">نوى العقارية — وثيقة سرية</p>
        </div>

        <AnimatePresence mode="wait">
          {!unlocked ? (
            <motion.div
              key="lock"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-sm mx-auto bg-white/5 border border-white/10 rounded-2xl p-8"
            >
              <div className="flex items-center justify-center gap-2 mb-6">
                <Shield className="w-4 h-4 text-[#C9A96E]" />
                <p className="text-white/50 text-sm">أدخل كلمة المرور للوصول إلى تفاصيل النظام</p>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleUnlock(); }}>
                <div className="relative mb-4">
                  <Input
                    type={showPw ? "text" : "password"}
                    placeholder="كلمة المرور"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(false); }}
                    className={`bg-white/5 border-white/20 text-white placeholder:text-white/30 text-center tracking-widest pr-10 ${error ? "border-red-500" : ""}`}
                    dir="ltr"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {error && <p className="text-red-400 text-xs text-center mb-4">كلمة المرور غير صحيحة</p>}
                <Button type="submit" className="w-full bg-[#C9A96E] hover:bg-[#b8944f] text-black font-bold">
                  فتح الوثيقة
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2 font-mono"
            >
              {/* ===== OVERVIEW ===== */}
              <Section title="نظرة عامة على نوى العقارية">
                <p className="text-white/55 text-xs leading-relaxed mb-4">
                  نوى العقارية — نظام متكامل يضم ثلاثة بوابات: موقع العميل العام (AR/EN)، بوابة الموظفين، ولوحة تحكم الإدارة. مبنية على React + Vite + Express 5 + PostgreSQL.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
                    <p className="text-blue-400 font-bold text-lg">3</p>
                    <p className="text-white/45 text-[10px]">بوابات</p>
                  </div>
                  <div className="bg-[#C9A96E]/10 border border-[#C9A96E]/20 rounded-xl p-3 text-center">
                    <p className="text-[#C9A96E] font-bold text-lg">AR/EN</p>
                    <p className="text-white/45 text-[10px]">ثنائي اللغة</p>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
                    <p className="text-green-400 font-bold text-lg">JWT</p>
                    <p className="text-white/45 text-[10px]">المصادقة</p>
                  </div>
                </div>
              </Section>

              {/* ===== PORTALS ===== */}
              <Section title="البوابات الثلاث">
                <div className="space-y-2.5">
                  {[
                    { badge: "/", badgeColor: "bg-blue-500/20 text-blue-400", title: "موقع العميل العام", desc: "الصفحة الرئيسية، المشاريع، الخدمات، مجلس الإدارة، الوسطاء، المركز الإعلامي، الوظائف، التواصل — متاح للجميع بدون تسجيل دخول، يدعم RTL/LTR" },
                    { badge: "/admin", badgeColor: "bg-purple-500/20 text-purple-400", title: "لوحة تحكم الإدارة", desc: "CRUD كامل: المشاريع، الخدمات، الأخبار، الوظائف، الوسطاء، المجلس، الموظفين، الصفحات، الرسائل، البريد، المحادثات الداخلية، مساعد AI، الإعدادات" },
                    { badge: "/employee", badgeColor: "bg-green-500/20 text-green-400", title: "بوابة الموظفين", desc: "لوحة القيادة، البريد الإلكتروني IMAP/SMTP، المحادثات الداخلية، صندوق الرسائل، مساعد AI — مقيدة بتسجيل الدخول" },
                  ].map(p => (
                    <div key={p.badge} className="bg-white/5 border border-white/8 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <StatusBadge color={p.badgeColor} text={p.badge} />
                        <span className="font-bold text-white text-sm">{p.title}</span>
                      </div>
                      <p className="text-white/45 text-xs leading-relaxed">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </Section>

              {/* ===== ADMIN CREDENTIALS ===== */}
              <Section title="بيانات تسجيل الدخول — الإدارة">
                <Row label="رابط تسجيل الدخول" value="/auth/login" />
                <Row label="البريد الإلكتروني (سوبر أدمن)" value="ceo@nawainv.sa" />
                <Row label="كلمة المرور (سوبر أدمن)" value="admin123" />
                <Row label="الدور" value="super_admin" mono={false} />
                <div className="mt-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <p className="text-yellow-400 text-xs">بعد تسجيل الدخول: سوبر أدمن → /admin — غيره → /employee</p>
                </div>
              </Section>

              {/* ===== EMPLOYEE CREDENTIALS ===== */}
              <Section title="بيانات تسجيل الدخول — الموظفون">
                <p className="text-white/35 text-xs mb-3">جميع الموظفين يسجلون بالبريد وكلمة المرور التي يحددها الأدمن عند إضافتهم.</p>
                <Row label="أحمد الراشد — مدير" value="ahmed@nawainv.sa" />
                <Row label="كلمة المرور" value="admin123" />
                <Row label="سارة الخالد — مدير محتوى" value="sara@nawainv.sa" />
                <Row label="كلمة المرور" value="admin123" />
              </Section>

              {/* ===== EMAIL ACCOUNTS ===== */}
              <Section title="حسابات البريد الإلكتروني IMAP/SMTP">
                <div className="bg-white/5 border border-white/8 rounded-xl p-3 mb-4 space-y-0">
                  <Row label="السيرفر (IMAP/SMTP)" value="server222.web-hosting.com" />
                  <Row label="منفذ IMAP" value="993 (SSL)" />
                  <Row label="منفذ SMTP" value="465 (SSL)" />
                  <Row label="كلمة مرور جميع الحسابات" value="ASDfgh@12345678nawa" />
                </div>
                <div className="space-y-2">
                  {[
                    { email: "ceo@nawainv.sa", label: "الرئيس التنفيذي" },
                    { email: "cob@nawainv.sa", label: "رئيس مجلس الإدارة" },
                    { email: "finance@nawainv.sa", label: "المالية" },
                    { email: "investment@nawainv.sa", label: "الاستثمار" },
                    { email: "marketing@nawainv.sa", label: "التسويق" },
                    { email: "support@nawainv.sa", label: "الدعم" },
                    { email: "info@nawainv.sa", label: "المعلومات العامة" },
                  ].map(acc => (
                    <div key={acc.email} className="flex items-center justify-between bg-white/3 border border-white/8 rounded-lg px-3 py-2">
                      <span className="text-white/40 text-xs">{acc.label}</span>
                      <span className="text-white/80 text-xs font-mono flex items-center">
                        {acc.email}
                        <CopyButton text={acc.email} />
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-blue-400 text-xs">الأدمن يختار الحساب المُرسَل منه من قائمة في صفحة البريد. الموظف يُعيَّن له حساب بريد من لوحة التحكم.</p>
                </div>
              </Section>

              {/* ===== AI ASSISTANT ===== */}
              <Section title="مساعد الذكاء الاصطناعي">
                <Row label="المزود" value="Kimi (Moonshot AI)" mono={false} />
                <Row label="الموديل" value="moonshot-v1-32k" />
                <Row label="مسار الدردشة" value="/api/ai/chat" />
                <Row label="مسار البث (Streaming)" value="/api/ai/stream" />
                <Row label="المتغير البيئي" value="KIMI_API_KEY" />
                <div className="mt-3 bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                  <p className="text-purple-400 text-xs">المساعد يدعم 6 أدوات وكيلة: صياغة وصف مشروع، كتابة خبر، صياغة بريد، تحليل السوق، توليد محتوى SEO، اقتراح استراتيجية استثمار.</p>
                </div>
              </Section>

              {/* ===== DATABASE ===== */}
              <Section title="قاعدة البيانات">
                <Row label="النوع" value="PostgreSQL" mono={false} />
                <Row label="ORM" value="Drizzle ORM" mono={false} />
                <Row label="المتغير البيئي" value="DATABASE_URL" />
                <Row label="أمر تحديث الجداول" value="pnpm --filter @workspace/db run push" />
                <Row label="أمر البذر (Seed)" value="pnpm --filter @workspace/scripts run seed" />
                <div className="mt-3">
                  <p className="text-white/35 text-xs mb-2">الجداول الرئيسية:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["users", "projects", "services", "news", "jobs", "brokers", "board_members", "conversations", "messages", "pages", "site_settings"].map(t => (
                      <span key={t} className="bg-white/5 border border-white/8 text-white/55 text-[10px] px-2 py-1 rounded font-mono">{t}</span>
                    ))}
                  </div>
                </div>
              </Section>

              {/* ===== ADMIN CONTROL ===== */}
              <Section title="صفحات لوحة التحكم (الأدمن)">
                <div className="space-y-1">
                  {[
                    { path: "/admin", desc: "لوحة القيادة — إحصاءات حية" },
                    { path: "/admin/projects", desc: "إدارة المشاريع العقارية" },
                    { path: "/admin/services", desc: "إدارة الخدمات" },
                    { path: "/admin/news", desc: "إدارة الأخبار والمركز الإعلامي" },
                    { path: "/admin/jobs", desc: "إدارة الوظائف والطلبات" },
                    { path: "/admin/brokers", desc: "إدارة الوسطاء العقاريين" },
                    { path: "/admin/board", desc: "إدارة مجلس الإدارة" },
                    { path: "/admin/employees", desc: "إدارة الموظفين والأدوار" },
                    { path: "/admin/messages", desc: "رسائل العملاء من صفحة التواصل" },
                    { path: "/admin/email", desc: "البريد الإلكتروني IMAP" },
                    { path: "/admin/email-accounts", desc: "تعيين حسابات بريد للموظفين" },
                    { path: "/admin/chat", desc: "المحادثات الداخلية" },
                    { path: "/admin/ai", desc: "مساعد Kimi AI" },
                    { path: "/admin/pages", desc: "إدارة صفحات الموقع (محتوى حر)" },
                    { path: "/admin/settings", desc: "إعدادات النظام: الاتصال، السوشيال ميديا، SEO، الفوتر" },
                  ].map(r => (
                    <div key={r.path} className="flex items-center justify-between py-2 border-b border-white/5">
                      <span className="text-white/40 text-xs">{r.desc}</span>
                      <span className="text-white/70 text-xs font-mono">{r.path}</span>
                    </div>
                  ))}
                </div>
              </Section>

              {/* ===== FEATURES ===== */}
              <Section title="مميزات نوى العقارية">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <FeatureCard icon="🌐" title="ثنائي اللغة (AR/EN)" desc="تبديل كامل بين العربية (RTL) والإنجليزية (LTR) بضغطة زر" />
                  <FeatureCard icon="🔐" title="JWT Authentication" desc="التوكن في localStorage — يُحقن تلقائياً في كل طلبات API" />
                  <FeatureCard icon="🤖" title="Kimi AI Agent" desc="moonshot-v1-32k مع 6 أدوات وكيلة متخصصة في العقارات" />
                  <FeatureCard icon="📧" title="بريد IMAP/SMTP" desc="7 حسابات — تعيين موظف لكل حساب، إرسال واستقبال كامل" />
                  <FeatureCard icon="💬" title="محادثات داخلية" desc="دردشة بين الموظفين مع polling في الوقت الفعلي" />
                  <FeatureCard icon="📊" title="إحصاءات حية" desc="إحصاءات API عامة (بدون auth) لعرضها في الصفحة الرئيسية" />
                  <FeatureCard icon="🎬" title="Splash Screen" desc="يظهر مرة واحدة لكل جلسة (sessionStorage) مع انيميشن سينمائي" />
                  <FeatureCard icon="📱" title="PWA كامل" desc="Service Worker + manifest + إشعارات + زر تثبيت" />
                  <FeatureCard icon="🔔" title="إشعارات صوتية" desc="WebAudio API — badges عددية + صوت عند وصول الرسائل" />
                  <FeatureCard icon="🔍" title="SEO احترافي" desc="JSON-LD structured data + sitemap.xml + robots.txt" />
                </div>
              </Section>

              {/* ===== TECH STACK ===== */}
              <Section title="التقنيات المستخدمة">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    ["React 19", "واجهة أمامية"],
                    ["Vite 7", "بناء الواجهة"],
                    ["TypeScript 5.9", "اللغة"],
                    ["Tailwind CSS", "التصميم"],
                    ["shadcn/ui", "مكونات UI"],
                    ["Framer Motion", "الحركة"],
                    ["Express 5", "API Server"],
                    ["PostgreSQL", "قاعدة البيانات"],
                    ["Drizzle ORM", "ORM"],
                    ["Orval", "API Codegen"],
                    ["React Query", "State"],
                    ["Zustand", "Language Store"],
                    ["bcryptjs", "تشفير كلمات المرور"],
                    ["JWT", "المصادقة"],
                    ["Kimi AI", "الذكاء الاصطناعي"],
                    ["Nodemailer", "إرسال البريد"],
                    ["imapflow", "استقبال البريد"],
                    ["pnpm workspaces", "إدارة الحزم"],
                  ].map(([name, desc]) => (
                    <div key={name} className="bg-white/5 border border-white/8 rounded-lg p-2.5 hover:border-[#C9A96E]/25 transition-colors">
                      <p className="text-white/85 text-xs font-bold">{name}</p>
                      <p className="text-white/35 text-[10px] mt-0.5">{desc}</p>
                    </div>
                  ))}
                </div>
              </Section>

              {/* ===== ENV VARS ===== */}
              <Section title="المتغيرات البيئية المطلوبة">
                <Row label="DATABASE_URL" value="postgresql://..." />
                <Row label="KIMI_API_KEY" value="sk-... (Kimi Moonshot key)" />
                <Row label="SESSION_SECRET" value="JWT signing secret" />
                <Row label="MONGODB_USERNAME" value="متاح — غير مُفعَّل حالياً" />
                <Row label="MONGODB_PASSWORD" value="متاح — غير مُفعَّل حالياً" />
              </Section>

              {/* ===== COLORS ===== */}
              <Section title="ألوان العلامة التجارية">
                <Row label="اللون الأساسي (Navy)" value="#0D1B3E" />
                <Row label="اللون الثانوي (Gold)" value="#C9A96E" />
                <Row label="الخط — Headings" value="Playfair Display" mono={false} />
                <Row label="الخط — EN Body" value="Inter" mono={false} />
                <Row label="الخط — AR Body" value="Tajawal" mono={false} />
                <Row label="Footer Credit" value="Built by Qirox Studio" mono={false} />
                <Row label="رابط Footer" value="https://qiroxstudio.online" />
              </Section>

              {/* ===== FOOTER ===== */}
              <div className="text-center pt-8 pb-4 border-t border-white/8">
                <img src={logoPath} alt="نوى" className="h-8 mx-auto mb-3 brightness-0 invert opacity-30" />
                <p className="text-white/20 text-xs">وثيقة سرية — نوى العقارية</p>
                <p className="text-white/10 text-[10px] mt-1">nawainv.sa © {new Date().getFullYear()}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
