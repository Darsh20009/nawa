import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, Copy, Check, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const TIPS_PASSWORD = "12345678";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="ml-2 text-[#C9A96E] hover:text-white transition-colors">
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-[#C9A96E] border-b border-[#C9A96E]/30 pb-2 mb-4 uppercase tracking-wider">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-white/5 gap-1">
      <span className="text-white/50 text-sm min-w-[180px]">{label}</span>
      <span className={`text-white/90 text-sm flex items-center ${mono ? "font-mono bg-white/5 px-2 py-0.5 rounded" : ""}`}>
        {value}
        <CopyButton text={value} />
      </span>
    </div>
  );
}

function Badge({ color, text }: { color: string; text: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{text}</span>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="text-2xl mb-2">{icon}</div>
      <h4 className="font-bold text-white mb-1 text-sm">{title}</h4>
      <p className="text-white/50 text-xs leading-relaxed">{desc}</p>
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
    <div className="min-h-screen bg-[#070f20] text-white font-mono" dir="rtl">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0D1B3E] border border-[#C9A96E]/40 mb-4">
            {unlocked ? <Unlock className="w-8 h-8 text-[#C9A96E]" /> : <Lock className="w-8 h-8 text-[#C9A96E]" />}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">دليل النظام الكامل</h1>
          <p className="text-white/40 text-sm">منصة نوى العقارية — وثيقة سرية</p>
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
              <p className="text-white/60 text-center mb-6 text-sm">أدخل كلمة المرور للوصول إلى تفاصيل النظام</p>
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
              className="space-y-2"
            >
              {/* ===== OVERVIEW ===== */}
              <Section title="نظرة عامة على المنصة">
                <p className="text-white/60 text-sm leading-relaxed mb-4">
                  منصة نوى العقارية هي نظام متكامل يضم ثلاثة بوابات: موقع العميل العام، بوابة الموظفين، ولوحة تحكم الإدارة. مبنية على React + Vite (واجهة أمامية)، Express 5 (API)، PostgreSQL + Drizzle ORM (قاعدة البيانات).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
                    <p className="text-blue-400 font-bold text-lg">3</p>
                    <p className="text-white/50 text-xs">بوابات</p>
                  </div>
                  <div className="bg-[#C9A96E]/10 border border-[#C9A96E]/20 rounded-xl p-3 text-center">
                    <p className="text-[#C9A96E] font-bold text-lg">AR/EN</p>
                    <p className="text-white/50 text-xs">ثنائي اللغة</p>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
                    <p className="text-green-400 font-bold text-lg">JWT</p>
                    <p className="text-white/50 text-xs">المصادقة</p>
                  </div>
                </div>
              </Section>

              {/* ===== PORTALS ===== */}
              <Section title="البوابات الثلاث">
                <div className="space-y-3">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge color="bg-blue-500/20 text-blue-400" text="/" />
                      <span className="font-bold text-white">موقع العميل العام</span>
                    </div>
                    <p className="text-white/50 text-xs">الصفحة الرئيسية، المشاريع، الخدمات، مجلس الإدارة، الوسطاء، المركز الإعلامي، الوظائف، التواصل — متاح للجميع بدون تسجيل دخول، يدعم RTL/LTR</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge color="bg-purple-500/20 text-purple-400" text="/admin" />
                      <span className="font-bold text-white">لوحة تحكم الإدارة</span>
                    </div>
                    <p className="text-white/50 text-xs">CRUD كامل: المشاريع، الخدمات، الأخبار، الوظائف، الوسطاء، المجلس، الموظفين، الصفحات، الرسائل، البريد الإلكتروني، المحادثات الداخلية، مساعد AI</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge color="bg-green-500/20 text-green-400" text="/employee" />
                      <span className="font-bold text-white">بوابة الموظفين</span>
                    </div>
                    <p className="text-white/50 text-xs">لوحة القيادة، البريد الإلكتروني، المحادثات الداخلية، صندوق الرسائل، مساعد AI — مقيدة بتسجيل الدخول</p>
                  </div>
                </div>
              </Section>

              {/* ===== ADMIN CREDENTIALS ===== */}
              <Section title="بيانات تسجيل الدخول — الإدارة">
                <Row label="رابط تسجيل الدخول" value="/auth/login" />
                <Row label="البريد الإلكتروني (سوبر أدمن)" value="admin@nawainv.sa" />
                <Row label="كلمة المرور (سوبر أدمن)" value="admin123" />
                <Row label="الدور" value="super_admin" mono={false} />
                <div className="mt-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <p className="text-yellow-400 text-xs">بعد تسجيل الدخول، يُوجَّه سوبر أدمن تلقائياً إلى /admin — يُوجَّه غيره إلى /employee</p>
                </div>
              </Section>

              {/* ===== EMPLOYEE CREDENTIALS ===== */}
              <Section title="بيانات تسجيل الدخول — الموظفون">
                <p className="text-white/40 text-xs mb-3">جميع الموظفين المُضافين من قبل الأدمن يُمكنهم تسجيل الدخول بنفس كلمة المرور التي يحددها الأدمن عند إضافتهم.</p>
                <Row label="أحمد الراشد" value="ahmed@nawainv.sa" />
                <Row label="كلمة المرور" value="admin123" />
                <Row label="سارة الخالد" value="sara@nawainv.sa" />
                <Row label="كلمة المرور" value="admin123" />
                <Row label="الدور (مدير)" value="manager" mono={false} />
                <Row label="الدور (محتوى)" value="content_manager" mono={false} />
                <Row label="الدور (موظف)" value="employee" mono={false} />
              </Section>

              {/* ===== EMAIL ACCOUNTS ===== */}
              <Section title="حسابات البريد الإلكتروني IMAP/SMTP">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4">
                  <Row label="السيرفر IMAP" value="server222.web-hosting.com" />
                  <Row label="منفذ IMAP" value="993 (SSL)" />
                  <Row label="السيرفر SMTP" value="server222.web-hosting.com" />
                  <Row label="منفذ SMTP" value="465 (SSL)" />
                  <Row label="كلمة مرور جميع الحسابات" value="ASDfgh@12345678nawa" />
                </div>
                <div className="space-y-2">
                  {[
                    { email: "info@nawainv.sa", label: "المعلومات العامة" },
                    { email: "invest@nawainv.sa", label: "الاستثمار" },
                    { email: "sales@nawainv.sa", label: "المبيعات" },
                    { email: "support@nawainv.sa", label: "الدعم" },
                    { email: "hr@nawainv.sa", label: "الموارد البشرية" },
                    { email: "media@nawainv.sa", label: "الإعلام" },
                    { email: "admin@nawainv.sa", label: "الإدارة (SMTP فقط)" },
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
                  <p className="text-blue-400 text-xs">ملاحظة: الأدمن يختار الحساب المُرسل منه من قائمة منسدلة (asAccount). admin@nawainv.sa لا يمتلك IMAP.</p>
                </div>
              </Section>

              {/* ===== AI ASSISTANT ===== */}
              <Section title="مساعد الذكاء الاصطناعي">
                <Row label="المزود" value="OpenRouter" mono={false} />
                <Row label="الموديل" value="qwen/qwen3-235b-a22b" />
                <Row label="مسار API" value="/api/ai/chat" />
                <Row label="المتغير البيئي" value="KIMI_API_KEY" />
                <p className="text-white/40 text-xs mt-3">المساعد متاح في /admin/ai و /employee/ai — يدعم السياق الكامل للمحادثة ويُرسل التوكن تلقائياً.</p>
              </Section>

              {/* ===== DATABASE ===== */}
              <Section title="قاعدة البيانات">
                <Row label="النوع" value="PostgreSQL" mono={false} />
                <Row label="ORM" value="Drizzle ORM" mono={false} />
                <Row label="المتغير البيئي" value="DATABASE_URL" />
                <Row label="أمر الـ push" value="pnpm --filter @workspace/db run push" />
                <Row label="أمر الـ seed" value="pnpm --filter @workspace/scripts run seed" />
                <div className="mt-3">
                  <p className="text-white/40 text-xs mb-2">الجداول الرئيسية:</p>
                  <div className="flex flex-wrap gap-2">
                    {["users","projects","services","news","jobs","brokers","board_members","conversations","messages","email_accounts","pages"].map(t => (
                      <span key={t} className="bg-white/5 border border-white/10 text-white/60 text-xs px-2 py-1 rounded font-mono">{t}</span>
                    ))}
                  </div>
                </div>
              </Section>

              {/* ===== FEATURES ===== */}
              <Section title="مميزات المنصة">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FeatureCard icon="🌐" title="ثنائي اللغة (AR/EN)" desc="تبديل كامل بين العربية (RTL) والإنجليزية (LTR) بضغطة زر — Zustand store ويحدد dir على html" />
                  <FeatureCard icon="🔐" title="JWT Authentication" desc="التوكن محفوظ في localStorage كـ nawa_token — يُحقن تلقائياً في كل طلبات API" />
                  <FeatureCard icon="🤖" title="مساعد AI" desc="مبني على OpenRouter — يدعم المحادثة المتعددة والسياق الكامل" />
                  <FeatureCard icon="📧" title="بريد إلكتروني IMAP/SMTP" desc="7 حسابات مع إمكانية تعيين موظف لكل حساب، وإرسال واستقبال بالكامل" />
                  <FeatureCard icon="💬" title="محادثات داخلية" desc="نظام دردشة داخلي بين الموظفين مع WebSocket polling" />
                  <FeatureCard icon="📊" title="لوحة تحكم" desc="إحصاءات live من API (مشاريع، وسطاء، إلخ) — endpoints عامة بدون auth" />
                  <FeatureCard icon="🎬" title="Splash Screen" desc="يظهر مرة واحدة لكل جلسة (sessionStorage flag) مع انيميشن سينمائي" />
                  <FeatureCard icon="📱" title="متجاوب بالكامل" desc="Sidebar يتحول لـ Sheet drawer على الجوال — RTL aware في كلا اتجاهي الفتح" />
                  <FeatureCard icon="🖼️" title="Cinematic Design" desc="Parallax hero، Framer Motion animations، Playfair Display headings" />
                  <FeatureCard icon="⚡" title="Contract-First API" desc="OpenAPI spec → Orval codegen → React Query hooks مُولَّدة تلقائياً" />
                </div>
              </Section>

              {/* ===== ROUTES ===== */}
              <Section title="مسارات التطبيق">
                <div className="space-y-1">
                  {[
                    { path: "/", desc: "الصفحة الرئيسية", badge: "عام" },
                    { path: "/about", desc: "من نحن", badge: "عام" },
                    { path: "/services", desc: "الخدمات", badge: "عام" },
                    { path: "/projects", desc: "المشاريع + فلترة", badge: "عام" },
                    { path: "/projects/:id", desc: "تفاصيل المشروع", badge: "عام" },
                    { path: "/board", desc: "مجلس الإدارة", badge: "عام" },
                    { path: "/media", desc: "المركز الإعلامي", badge: "عام" },
                    { path: "/careers", desc: "الوظائف + التقديم", badge: "عام" },
                    { path: "/brokers", desc: "الوسطاء", badge: "عام" },
                    { path: "/contact", desc: "تواصل معنا", badge: "عام" },
                    { path: "/auth/login", desc: "تسجيل الدخول", badge: "عام" },
                    { path: "/admin", desc: "لوحة القيادة", badge: "أدمن" },
                    { path: "/admin/projects", desc: "إدارة المشاريع", badge: "أدمن" },
                    { path: "/admin/services", desc: "إدارة الخدمات", badge: "أدمن" },
                    { path: "/admin/news", desc: "إدارة الأخبار", badge: "أدمن" },
                    { path: "/admin/jobs", desc: "إدارة الوظائف", badge: "أدمن" },
                    { path: "/admin/brokers", desc: "إدارة الوسطاء", badge: "أدمن" },
                    { path: "/admin/board", desc: "إدارة المجلس", badge: "أدمن" },
                    { path: "/admin/employees", desc: "إدارة الموظفين", badge: "أدمن" },
                    { path: "/admin/messages", desc: "رسائل العملاء", badge: "أدمن" },
                    { path: "/admin/email", desc: "البريد الإلكتروني", badge: "أدمن" },
                    { path: "/admin/email-accounts", desc: "حسابات البريد", badge: "أدمن" },
                    { path: "/admin/chat", desc: "المحادثات الداخلية", badge: "أدمن" },
                    { path: "/admin/ai", desc: "مساعد AI", badge: "أدمن" },
                    { path: "/admin/pages", desc: "إدارة الصفحات", badge: "أدمن" },
                    { path: "/employee", desc: "لوحة القيادة", badge: "موظف" },
                    { path: "/employee/email", desc: "البريد الإلكتروني", badge: "موظف" },
                    { path: "/employee/chat", desc: "المحادثات", badge: "موظف" },
                    { path: "/employee/inbox", desc: "صندوق الرسائل", badge: "موظف" },
                    { path: "/employee/ai", desc: "مساعد AI", badge: "موظف" },
                    { path: "/tips", desc: "هذه الصفحة", badge: "سري" },
                  ].map(r => (
                    <div key={r.path} className="flex items-center justify-between py-1.5 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <Badge
                          color={r.badge === "عام" ? "bg-blue-500/15 text-blue-400" : r.badge === "أدمن" ? "bg-purple-500/15 text-purple-400" : r.badge === "موظف" ? "bg-green-500/15 text-green-400" : "bg-[#C9A96E]/15 text-[#C9A96E]"}
                          text={r.badge}
                        />
                        <span className="text-white/40 text-xs">{r.desc}</span>
                      </div>
                      <span className="text-white/70 text-xs font-mono">{r.path}</span>
                    </div>
                  ))}
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
                    ["Express 5", "API server"],
                    ["PostgreSQL", "قاعدة البيانات"],
                    ["Drizzle ORM", "ORM"],
                    ["Orval", "API codegen"],
                    ["React Query", "State management"],
                    ["Zustand", "Language store"],
                    ["bcryptjs", "تشفير كلمات المرور"],
                    ["JWT", "المصادقة"],
                    ["OpenRouter", "AI"],
                    ["Nodemailer", "إرسال البريد"],
                    ["IMAP", "استقبال البريد"],
                    ["pnpm workspaces", "إدارة الحزم"],
                  ].map(([name, desc]) => (
                    <div key={name} className="bg-white/5 border border-white/10 rounded-lg p-2.5">
                      <p className="text-white/90 text-xs font-bold">{name}</p>
                      <p className="text-white/40 text-xs">{desc}</p>
                    </div>
                  ))}
                </div>
              </Section>

              {/* ===== ENV VARS ===== */}
              <Section title="المتغيرات البيئية المطلوبة">
                <Row label="DATABASE_URL" value="postgresql://..." />
                <Row label="KIMI_API_KEY" value="sk-... (OpenRouter key)" />
                <Row label="SESSION_SECRET" value="JWT signing secret" />
                <Row label="MONGODB_USERNAME" value="قيد الاستخدام" />
                <Row label="MONGODB_PASSWORD" value="قيد الاستخدام" />
              </Section>

              {/* ===== COLORS ===== */}
              <Section title="ألوان ونصوص العلامة التجارية">
                <Row label="اللون الأساسي (Navy)" value="#0D1B3E" />
                <Row label="اللون الثانوي (Gold)" value="#C9A96E" />
                <Row label="الخط (Headings)" value="Playfair Display" mono={false} />
                <Row label="الخط (EN Body)" value="Inter" mono={false} />
                <Row label="الخط (AR Body)" value="Tajawal" mono={false} />
                <Row label="Footer" value="Built by Qirox Studio" mono={false} />
                <Row label="رابط Footer" value="https://qiroxstudio.online" />
              </Section>

              {/* ===== FOOTER ===== */}
              <div className="text-center pt-8 pb-4 border-t border-white/10">
                <p className="text-white/20 text-xs">وثيقة سرية — منصة نوى العقارية</p>
                <p className="text-white/10 text-xs mt-1">nawainv.sa © 2026</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
