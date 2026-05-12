import { useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useGetDashboardStats } from "@workspace/api-client-react";
import { Building2, Users, Briefcase, MessageSquare, Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const { language } = useLanguage();

  useEffect(() => {
    document.title = language === "ar" ? "لوحة القيادة | منصة نوى العقارية" : "Dashboard | Nawa Real Estate Platform";
  }, [language]);

  const { data: stats, isLoading } = useGetDashboardStats({
    query: { queryKey: ["dashboardStats"] }
  });

  const statCards = [
    { title: language === "ar" ? "إجمالي المشاريع" : "Total Projects", value: stats?.totalProjects, icon: Building2, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: language === "ar" ? "إجمالي الوسطاء" : "Total Brokers", value: stats?.totalBrokers, icon: Users, color: "text-green-500", bg: "bg-green-500/10" },
    { title: language === "ar" ? "إجمالي الموظفين" : "Total Employees", value: stats?.totalEmployees, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
    { title: language === "ar" ? "الوظائف المتاحة" : "Active Jobs", value: stats?.activeJobs || stats?.totalJobs, icon: Briefcase, color: "text-orange-500", bg: "bg-orange-500/10" },
    { title: language === "ar" ? "الرسائل الجديدة" : "New Messages", value: stats?.newMessages, icon: Inbox, color: "text-red-500", bg: "bg-red-500/10" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-serif text-foreground mb-6">
        {language === "ar" ? "لوحة القيادة" : "Dashboard"}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-border shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="w-10 h-10 rounded-xl" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))
        ) : (
          statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className="bg-white p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-medium text-muted-foreground">{card.title}</h3>
                  <div className={`w-10 h-10 rounded-xl ${card.bg} ${card.color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground">{card.value || 0}</p>
              </div>
            );
          })
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
           <h3 className="text-lg font-bold font-serif mb-4">
             {language === "ar" ? "المشاريع المميزة" : "Featured Projects"}
           </h3>
           <p className="text-muted-foreground">
             {language === "ar" ? "يوجد " : "There are "} 
             <span className="font-bold text-foreground">{stats?.featuredProjects || 0}</span> 
             {language === "ar" ? " مشاريع مميزة معروضة حالياً في الصفحة الرئيسية." : " featured projects currently displayed on the homepage."}
           </p>
        </div>
      </div>
    </div>
  );
}