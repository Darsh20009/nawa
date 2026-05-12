import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";
import logoPath from "@assets/Screenshot_2026-05-12_at_1.51.13_PM_1778583134608.png";
import { 
  LayoutDashboard, 
  Building2, 
  Briefcase, 
  Newspaper, 
  Users, 
  UserCircle, 
  Settings, 
  MessageSquare, 
  Bot, 
  LogOut,
  Menu,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const { language, toggleLanguage, isRtl } = useLanguage();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.role.includes("admin"))) {
      window.location.href = "/auth/login";
    }
  }, [isAuthenticated, isLoading, user]);

  if (isLoading || !isAuthenticated) return null;

  const sidebarLinks = [
    { href: "/admin", label: language === "ar" ? "لوحة القيادة" : "Dashboard", icon: LayoutDashboard },
    { href: "/admin/projects", label: language === "ar" ? "المشاريع" : "Projects", icon: Building2 },
    { href: "/admin/services", label: language === "ar" ? "الخدمات" : "Services", icon: Briefcase },
    { href: "/admin/news", label: language === "ar" ? "المركز الإعلامي" : "Media Center", icon: Newspaper },
    { href: "/admin/jobs", label: language === "ar" ? "الوظائف" : "Jobs", icon: Briefcase },
    { href: "/admin/brokers", label: language === "ar" ? "الوسطاء" : "Brokers", icon: Users },
    { href: "/admin/board", label: language === "ar" ? "مجلس الإدارة" : "Board Members", icon: UserCircle },
    { href: "/admin/employees", label: language === "ar" ? "الموظفين" : "Employees", icon: Users },
    { href: "/admin/messages", label: language === "ar" ? "صندوق الوارد" : "Inbox", icon: MessageSquare },
    { href: "/admin/pages", label: language === "ar" ? "الصفحات" : "Pages", icon: Settings },
    { href: "/admin/chat", label: language === "ar" ? "المحادثات" : "Internal Chat", icon: MessageSquare },
    { href: "/admin/ai", label: language === "ar" ? "مساعد نوى الذكي" : "AI Assistant", icon: Bot },
  ];

  return (
    <div className="min-h-[100dvh] flex bg-muted/20">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex-shrink-0 flex flex-col hidden lg:flex border-r border-sidebar-border sticky top-0 h-[100dvh]">
        <div className="h-20 flex items-center px-6 border-b border-sidebar-border bg-sidebar-accent/30">
          <Link href="/">
            <img src={logoPath} alt="Nawa" className="h-8 brightness-0 invert" />
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.href || (link.href !== "/admin" && location.startsWith(link.href));
            
            return (
              <Link key={link.href} href={link.href}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer",
                  isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" 
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}>
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="truncate">{link.label}</span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-sidebar-primary font-bold">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{language === "ar" ? user?.nameAr || user?.name : user?.name}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate capitalize">{user?.role.replace("_", " ")}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sidebar-foreground/80 hover:text-white hover:bg-white/10" 
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
            {language === "ar" ? "تسجيل الخروج" : "Logout"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="w-5 h-5" />
            </Button>
            <h2 className="text-xl font-semibold text-foreground hidden sm:block">
              {language === "ar" ? "بوابة الإدارة" : "Admin Portal"}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={toggleLanguage} className="gap-2">
              <Globe className="w-4 h-4" />
              <span>{language === "ar" ? "EN" : "AR"}</span>
            </Button>
            <Link href="/">
              <Button variant="outline" size="sm">
                {language === "ar" ? "الموقع الرئيسي" : "Main Website"}
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}