import { useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useGetDashboardStats } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Building2, Users, Briefcase, MessageSquare, Inbox, TrendingUp, Star, Clock, ArrowRight, ArrowLeft, Bot, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

function StatCard({ title, value, icon: Icon, color, bg, isLoading, suffix }: {
  title: string; value?: number | string; icon: any; color: string; bg: string; isLoading?: boolean; suffix?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
    >
      {isLoading ? (
        <>
          <div className="flex justify-between items-start mb-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="w-11 h-11 rounded-xl" />
          </div>
          <Skeleton className="h-9 w-20 mt-2" />
        </>
      ) : (
        <>
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-medium text-muted-foreground leading-tight">{title}</p>
            <div className={`w-11 h-11 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {value ?? 0}{suffix && <span className="text-base font-normal text-muted-foreground ms-1">{suffix}</span>}
          </p>
        </>
      )}
    </motion.div>
  );
}

const quickActions = (language: string, isRtl: boolean) => [
  { href: "/admin/projects", label: language === "ar" ? "مشروع جديد" : "New Project", icon: Building2, color: "bg-blue-500" },
  { href: "/admin/employees", label: language === "ar" ? "موظف جديد" : "New Employee", icon: Users, color: "bg-purple-500" },
  { href: "/admin/news", label: language === "ar" ? "خبر جديد" : "New Article", icon: MessageSquare, color: "bg-green-500" },
  { href: "/admin/email", label: language === "ar" ? "البريد الإلكتروني" : "Email Inbox", icon: Mail, color: "bg-orange-500" },
  { href: "/admin/ai", label: language === "ar" ? "مساعد الذكاء" : "AI Assistant", icon: Bot, color: "bg-pink-500" },
  { href: "/admin/messages", label: language === "ar" ? "رسائل العملاء" : "Client Messages", icon: Inbox, color: "bg-yellow-500" },
];

export default function AdminDashboard() {
  const { language, isRtl } = useLanguage();
  const { user } = useAuth();
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  useEffect(() => {
    document.title = language === "ar" ? "لوحة القيادة | منصة نوى العقارية" : "Dashboard | Nawa Real Estate Platform";
  }, [language]);

  const { data: stats, isLoading } = useGetDashboardStats({
    query: { queryKey: ["dashboardStats"] }
  });

  const hour = new Date().getHours();
  const greeting = language === "ar"
    ? (hour < 12 ? "صباح الخير" : hour < 17 ? "مساء الخير" : "مساء النور")
    : (hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening");

  const statCards = [
    { title: language === "ar" ? "إجمالي المشاريع" : "Total Projects", value: stats?.totalProjects, icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
    { title: language === "ar" ? "الوسطاء المعتمدون" : "Certified Brokers", value: stats?.totalBrokers, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: language === "ar" ? "إجمالي الموظفين" : "Total Employees", value: stats?.totalEmployees, icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
    { title: language === "ar" ? "الوظائف النشطة" : "Active Jobs", value: stats?.activeJobs || stats?.totalJobs, icon: Briefcase, color: "text-orange-600", bg: "bg-orange-50" },
    { title: language === "ar" ? "رسائل العملاء" : "Client Messages", value: stats?.totalMessages, icon: Inbox, color: "text-red-600", bg: "bg-red-50" },
    { title: language === "ar" ? "المشاريع المميزة" : "Featured Projects", value: stats?.featuredProjects, icon: Star, color: "text-yellow-600", bg: "bg-yellow-50" },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">{greeting}،</p>
          <h1 className="text-2xl font-bold font-serif text-foreground">
            {language === "ar" ? user?.nameAr || user?.name : user?.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            {language === "ar" ? "النظام يعمل بكفاءة" : "System operating normally"}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, i) => (
          <StatCard key={i} {...card} isLoading={isLoading} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
        <h3 className="text-base font-bold font-serif mb-4 text-foreground">
          {language === "ar" ? "وصول سريع" : "Quick Actions"}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {quickActions(language, isRtl).map((action, i) => {
            const Icon = action.icon;
            return (
              <Link key={i} href={action.href}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer text-center"
                >
                  <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-foreground leading-tight">{action.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold font-serif">{language === "ar" ? "نسبة الإنجاز" : "Completion Rate"}</h3>
          </div>
          <p className="text-4xl font-bold mb-1">{stats?.featuredProjects || 0}<span className="text-xl font-normal text-white/70">/{stats?.totalProjects || 0}</span></p>
          <p className="text-white/70 text-sm">{language === "ar" ? "مشاريع مميزة من إجمالي المشاريع" : "featured out of total projects"}</p>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
              <Inbox className="w-5 h-5 text-yellow-600" />
            </div>
            <h3 className="font-bold font-serif text-foreground">{language === "ar" ? "الرسائل الجديدة" : "New Messages"}</h3>
          </div>
          <p className="text-4xl font-bold text-foreground mb-1">{stats?.newMessages || 0}</p>
          <p className="text-muted-foreground text-sm mb-4">{language === "ar" ? "رسائل تنتظر الرد" : "messages awaiting reply"}</p>
          <Link href="/admin/messages">
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              {language === "ar" ? "عرض الرسائل" : "View Messages"}
              <ArrowIcon className="w-3 h-3" />
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-secondary" />
            </div>
            <h3 className="font-bold font-serif text-foreground">{language === "ar" ? "إجراءات مقترحة" : "Suggested Actions"}</h3>
          </div>
          <div className="space-y-2">
            {[
              { label: language === "ar" ? "مراجعة رسائل العملاء" : "Review client messages", href: "/admin/messages" },
              { label: language === "ar" ? "تحديث المشاريع المميزة" : "Update featured projects", href: "/admin/projects" },
              { label: language === "ar" ? "مراجعة طلبات التوظيف" : "Review job applications", href: "/admin/jobs" },
            ].map((item, i) => (
              <Link key={i} href={item.href}>
                <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
                  <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors flex-1">{item.label}</span>
                  <ArrowIcon className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
