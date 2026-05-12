import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";
const logoPath = "/logo-transparent.png";
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
  Globe,
  Mail,
  Inbox,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface SidebarSection {
  title: string;
  links: { href: string; label: string; icon: any }[];
}

function SidebarContent({
  sections,
  location,
  user,
  language,
  logout,
  onNavigate,
}: {
  sections: SidebarSection[];
  location: string;
  user: any;
  language: string;
  logout: () => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="h-16 flex items-center px-5 border-b border-sidebar-border bg-sidebar-accent/30 gap-3 shrink-0">
        <Link href="/" onClick={onNavigate}>
          <img src={logoPath} alt="Nawa" className="h-7 brightness-0 invert" />
        </Link>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 border-r border-sidebar-foreground/20 pl-3 rtl:pl-0 rtl:pr-3">
          {language === "ar" ? "الإدارة" : "Admin"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 px-3 mb-1.5">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.links.map((link) => {
                const Icon = link.icon;
                const isActive = location === link.href || (link.href !== "/admin" && location.startsWith(link.href));
                return (
                  <Link key={link.href} href={link.href} onClick={onNavigate}>
                    <div className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}>
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate text-sm">{link.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/10 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-sidebar-primary font-bold text-sm">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{language === "ar" ? user?.nameAr || user?.name : user?.name}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate capitalize">{user?.role?.replace("_", " ")}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/80 hover:text-white hover:bg-white/10 text-sm"
          onClick={logout}
        >
          <LogOut className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
          {language === "ar" ? "تسجيل الخروج" : "Logout"}
        </Button>
      </div>
    </>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.role.includes("admin"))) {
      window.location.href = "/auth/login";
    }
  }, [isAuthenticated, isLoading, user]);

  if (isLoading || !isAuthenticated) return null;

  const sections: SidebarSection[] = [
    {
      title: language === "ar" ? "الرئيسية" : "Overview",
      links: [
        { href: "/admin", label: language === "ar" ? "لوحة القيادة" : "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: language === "ar" ? "المحتوى" : "Content",
      links: [
        { href: "/admin/projects", label: language === "ar" ? "المشاريع" : "Projects", icon: Building2 },
        { href: "/admin/services", label: language === "ar" ? "الخدمات" : "Services", icon: Briefcase },
        { href: "/admin/news", label: language === "ar" ? "المركز الإعلامي" : "Media Center", icon: Newspaper },
        { href: "/admin/jobs", label: language === "ar" ? "الوظائف" : "Jobs", icon: Briefcase },
        { href: "/admin/pages", label: language === "ar" ? "الصفحات" : "Pages", icon: Settings },
      ],
    },
    {
      title: language === "ar" ? "الأشخاص" : "People",
      links: [
        { href: "/admin/brokers", label: language === "ar" ? "الوسطاء" : "Brokers", icon: Users },
        { href: "/admin/board", label: language === "ar" ? "مجلس الإدارة" : "Board Members", icon: UserCircle },
        { href: "/admin/employees", label: language === "ar" ? "الموظفون" : "Employees", icon: Users },
      ],
    },
    {
      title: language === "ar" ? "التواصل" : "Communication",
      links: [
        { href: "/admin/messages", label: language === "ar" ? "رسائل العملاء" : "Client Messages", icon: Inbox },
        { href: "/admin/email", label: language === "ar" ? "البريد الإلكتروني" : "Email", icon: Mail },
        { href: "/admin/email-accounts", label: language === "ar" ? "حسابات البريد" : "Email Accounts", icon: ChevronRight },
        { href: "/admin/chat", label: language === "ar" ? "المحادثات الداخلية" : "Internal Chat", icon: MessageSquare },
        { href: "/admin/ai", label: language === "ar" ? "مساعد نوى الذكي" : "AI Assistant", icon: Bot },
      ],
    },
  ];

  return (
    <div className="min-h-[100dvh] flex bg-muted/20">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex-shrink-0 flex-col hidden lg:flex border-r border-sidebar-border sticky top-0 h-[100dvh]">
        <SidebarContent sections={sections} location={location} user={user} language={language} logout={logout} />
      </aside>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side={language === "ar" ? "right" : "left"}
          className="w-72 p-0 bg-sidebar text-sidebar-foreground border-sidebar-border flex flex-col"
        >
          <SidebarContent
            sections={sections}
            location={location}
            user={user}
            language={language}
            logout={logout}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 md:h-16 bg-white border-b border-border flex items-center justify-between px-3 md:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden w-9 h-9"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{language === "ar" ? "بوابة الإدارة" : "Admin"}</span>
              <ChevronRight className="w-4 h-4 rtl:-scale-x-100" />
              <span className="capitalize text-xs">{location.split("/").pop()?.replace("-", " ") || "dashboard"}</span>
            </div>
            {/* Mobile: show logo */}
            <Link href="/" className="lg:hidden">
              <img src={logoPath} alt="Nawa" className="h-6" />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={toggleLanguage} className="gap-1.5 h-8 px-2.5 text-xs">
              <Globe className="w-3.5 h-3.5" />
              <span>{language === "ar" ? "EN" : "AR"}</span>
            </Button>
            <Link href="/">
              <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs hidden sm:flex">
                {language === "ar" ? "الموقع" : "Website"}
              </Button>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-3 md:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
