import { useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { MessageSquare, Inbox, Bot } from "lucide-react";

export default function EmployeeDashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();

  useEffect(() => {
    document.title = language === "ar" ? "لوحة القيادة | نوى العقارية" : "Dashboard | Nawa Real Estate Platform";
  }, [language]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl border border-border shadow-sm"
      >
        <h1 className="text-3xl font-bold font-serif mb-2 text-foreground">
          {language === "ar" ? "مرحباً،" : "Welcome,"} {language === "ar" ? user?.nameAr || user?.name : user?.name}
        </h1>
        <p className="text-muted-foreground">
          {language === "ar" 
            ? "نظرة عامة على مهامك ومحادثاتك اليومية."
            : "Overview of your daily tasks and conversations."}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/employee/chat">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-1 text-foreground">
              {language === "ar" ? "المحادثات الداخلية" : "Internal Chat"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {language === "ar" ? "تواصل مع فريق العمل" : "Communicate with the team"}
            </p>
          </motion.div>
        </Link>

        <Link href="/employee/inbox">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-1 text-foreground">
              {language === "ar" ? "صندوق الوارد" : "Inbox"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {language === "ar" ? "إدارة رسائل العملاء" : "Manage client messages"}
            </p>
          </motion.div>
        </Link>

        <Link href="/employee/ai">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-1 text-foreground">
              {language === "ar" ? "مساعد نوى الذكي" : "Nawa AI Assistant"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {language === "ar" ? "مساعدة ذكية للمهام" : "Smart assistance for tasks"}
            </p>
          </motion.div>
        </Link>
      </div>
    </div>
  );
}