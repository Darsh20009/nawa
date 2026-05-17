import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, BellOff, Check, CheckCheck, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/use-language";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import {
  type AppNotification,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  onWsNotification,
} from "@/hooks/use-notifications";
import { useToast } from "@/hooks/use-toast";

const TYPE_COLORS: Record<string, string> = {
  success: "bg-green-500/10 border-green-500/30 text-green-700",
  error: "bg-red-500/10 border-red-500/30 text-red-700",
  warning: "bg-yellow-500/10 border-yellow-500/30 text-yellow-700",
  info: "bg-blue-500/10 border-blue-500/30 text-blue-700",
};

function timeAgo(dateStr: string, ar: boolean): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return ar ? "الآن" : "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return ar ? `منذ ${m} دقيقة` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return ar ? `منذ ${h} ساعة` : `${h}h ago`;
  return ar ? `منذ ${Math.floor(h / 24)} يوم` : `${Math.floor(h / 24)}d ago`;
}

interface Props {
  className?: string;
}

export function NotificationBell({ className }: Props) {
  const { language } = useLanguage();
  const ar = language === "ar";
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { pushEnabled, pushSupported, requestPermission } = usePushNotifications(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { notifications: n, unreadCount: u } = await fetchNotifications();
      if (!mountedRef.current) return;
      setNotifications(n);
      setUnreadCount(u);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Listen for real-time WS notifications
  useEffect(() => {
    const unsub = onWsNotification((notif) => {
      if (!mountedRef.current) return;
      setNotifications((prev) => {
        const exists = prev.find((n) => n.id === notif.id);
        if (exists) return prev;
        return [notif, ...prev.slice(0, 49)];
      });
      setUnreadCount((c) => c + 1);

      // Show toast
      toast({
        title: notif.title,
        description: notif.body,
        duration: 5000,
      });
    });
    return unsub;
  }, [toast]);

  const handleOpen = (v: boolean) => {
    setOpen(v);
    if (v) load();
  };

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleDelete = async (id: string, wasUnread: boolean) => {
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handlePushToggle = async () => {
    if (pushEnabled) {
      toast({ title: ar ? "الإشعارات مفعّلة بالفعل" : "Push already enabled" });
      return;
    }
    const ok = await requestPermission();
    toast({
      title: ok
        ? (ar ? "✅ تم تفعيل إشعارات النظام" : "✅ Push notifications enabled")
        : (ar ? "⚠️ تعذّر تفعيل الإشعارات" : "⚠️ Could not enable push"),
    });
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("w-9 h-9 relative", className)}
          aria-label={ar ? "الإشعارات" : "Notifications"}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 p-0 shadow-xl border-border"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">{ar ? "الإشعارات" : "Notifications"}</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-[10px] h-4 px-1.5">{unreadCount}</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {pushSupported && (
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7"
                onClick={handlePushToggle}
                title={pushEnabled ? (ar ? "إشعارات النظام مفعّلة" : "Push enabled") : (ar ? "تفعيل إشعارات النظام" : "Enable push")}
              >
                {pushEnabled ? <Bell className="w-3.5 h-3.5 text-green-500" /> : <BellOff className="w-3.5 h-3.5 text-muted-foreground" />}
              </Button>
            )}
            {unreadCount > 0 && (
              <Button variant="ghost" size="icon" className="w-7 h-7" onClick={handleMarkAll} title={ar ? "قراءة الكل" : "Mark all read"}>
                <CheckCheck className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Body */}
        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm">{ar ? "لا توجد إشعارات" : "No notifications"}</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex gap-2 p-3 transition-colors group",
                    !n.read && "bg-primary/5",
                  )}
                >
                  <span className="text-lg shrink-0 mt-0.5">{n.icon || "🔔"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1 mb-0.5">
                      <p className={cn("text-xs font-semibold leading-snug", !n.read ? "text-foreground" : "text-muted-foreground")}>
                        {n.title}
                      </p>
                      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.read && (
                          <button onClick={() => handleMarkRead(n.id)} className="p-0.5 rounded hover:bg-muted" title={ar ? "تعليم كمقروء" : "Mark read"}>
                            <Check className="w-3 h-3 text-green-500" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(n.id, !n.read)} className="p-0.5 rounded hover:bg-muted" title={ar ? "حذف" : "Delete"}>
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                        {n.link && (
                          <a href={n.link} onClick={() => { setOpen(false); handleMarkRead(n.id); }} className="p-0.5 rounded hover:bg-muted">
                            <ExternalLink className="w-3 h-3 text-primary" />
                          </a>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.createdAt, ar)}</p>
                  </div>
                  {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-border p-2 text-center">
            <a href="/employee/notifications" onClick={() => setOpen(false)} className="text-xs text-primary hover:underline">
              {ar ? "عرض كل الإشعارات" : "View all notifications"}
            </a>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
