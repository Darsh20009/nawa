import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";
import { useAuthNotifications } from "@/hooks/use-notifications";
import { NotificationBell } from "@/components/shared/notification-bell";
const logoPath = "/logo-transparent.png";
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  LogOut,
  Menu,
  Globe,
  Inbox,
  Mail,
  Bell,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

function SidebarContent({
  sidebarLinks,
  location,
  user,
  language,
  logout,
  onNavigate,
  soundOn,
  onToggleSound,
}: {
  sidebarLinks: { href: string; label: string; icon: any; badge?: number }[];
  location: string;
  user: any;
  language: string;
  logout: () => void;
  onNavigate?: () => void;
  soundOn: boolean;
  onToggleSound: () => void;
}) {
  return (
    <>
      <div className="h-20 flex items-center px-6 border-b border-sidebar-border bg-sidebar-accent/30 shrink-0">
        <Link href="/" onClick={onNavigate}>
          <img src={logoPath} alt="Nawa" className="h-8 brightness-0 invert" />
        </Link>
      </div>

      <div className="px-4 py-3 border-b border-sidebar-border/50 bg-sidebar-accent/10 shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 mb-1">
          {language === "ar" ? "بوابة الموظفين" : "Employee Portal"}
        </p>
        <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {sidebarLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href || (link.href !== "/employee" && location.startsWith(link.href));
          return (
            <Link key={link.href} href={link.href} onClick={onNavigate}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}>
                <Icon className="w-5 h-5 shrink-0" />
                <span className="truncate flex-1">{link.label}</span>
                {link.badge != null && link.badge > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {link.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
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
          <button
            onClick={onToggleSound}
            className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors shrink-0"
            title={soundOn ? (language === "ar" ? "كتم الصوت" : "Mute") : (language === "ar" ? "تفعيل الصوت" : "Unmute")}
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-sidebar-foreground/60" /> : <VolumeX className="w-4 h-4 text-sidebar-foreground/30" />}
          </button>
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
    </>
  );
}

export function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { counts, soundOn, toggleSound, unreadCount } = useAuthNotifications();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/auth/login";
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading || !isAuthenticated) return null;

  const sidebarLinks = [
    { href: "/employee", label: language === "ar" ? "لوحة القيادة" : "Dashboard", icon: LayoutDashboard },
    { href: "/employee/email", label: language === "ar" ? "البريد الإلكتروني" : "Email", icon: Mail, badge: counts.emails },
    { href: "/employee/chat", label: language === "ar" ? "المحادثات الداخلية" : "Internal Chat", icon: MessageSquare, badge: counts.chat },
    { href: "/employee/inbox", label: language === "ar" ? "صندوق الرسائل" : "Messages", icon: Inbox, badge: counts.messages },
    { href: "/employee/notifications", label: language === "ar" ? "الإشعارات" : "Notifications", icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined },
    { href: "/employee/ai", label: language === "ar" ? "نوى مي" : "Nawa Me", icon: Bot },
  ];

  return (
    <div className="min-h-[100dvh] flex bg-muted/20">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex-shrink-0 flex-col hidden lg:flex border-r border-sidebar-border sticky top-0 h-[100dvh]">
        <SidebarContent
          sidebarLinks={sidebarLinks}
          location={location}
          user={user}
          language={language}
          logout={logout}
          soundOn={soundOn}
          onToggleSound={toggleSound}
        />
      </aside>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side={language === "ar" ? "right" : "left"}
          className="w-72 p-0 bg-sidebar text-sidebar-foreground border-sidebar-border flex flex-col"
        >
          <SidebarContent
            sidebarLinks={sidebarLinks}
            location={location}
            user={user}
            language={language}
            logout={logout}
            onNavigate={() => setMobileOpen(false)}
            soundOn={soundOn}
            onToggleSound={toggleSound}
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
            <h2 className="text-base md:text-lg font-semibold text-foreground hidden sm:block">
              {language === "ar" ? "بوابة الموظفين" : "Employee Portal"}
            </h2>
            <Link href="/" className="lg:hidden">
              <img src={logoPath} alt="Nawa" className="h-6" />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
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
