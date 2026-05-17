import { useEffect, useState, useCallback } from "react";
import { useLanguage } from "@/hooks/use-language";
import {
  type AppNotification,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "@/hooks/use-notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCheck, Trash2, Bell, ExternalLink, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<string, { ar: string; en: string; color: string }> = {
  success: { ar: "نجاح", en: "Success", color: "bg-green-100 text-green-700 border-green-200" },
  error: { ar: "خطأ", en: "Error", color: "bg-red-100 text-red-700 border-red-200" },
  warning: { ar: "تنبيه", en: "Warning", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  info: { ar: "معلومة", en: "Info", color: "bg-blue-100 text-blue-700 border-blue-200" },
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

export default function NotificationsPage() {
  const { language } = useLanguage();
  const ar = language === "ar";

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = ar ? "الإشعارات | نوى العقارية" : "Notifications | Nawa Real Estate";
  }, [ar]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { notifications: n, unreadCount: u } = await fetchNotifications();
      setNotifications(n);
      setUnreadCount(u);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold font-serif">{ar ? "الإشعارات" : "Notifications"}</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">{unreadCount}</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAll} className="gap-1.5 text-xs h-8">
            <CheckCheck className="w-3.5 h-3.5" />
            {ar ? "قراءة الكل" : "Mark all read"}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-4 flex gap-3">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-16 flex flex-col items-center text-muted-foreground">
          <Bell className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-base font-medium">{ar ? "لا توجد إشعارات" : "No notifications yet"}</p>
          <p className="text-sm mt-1">{ar ? "ستظهر هنا جميع تنبيهاتك وإشعاراتك" : "All your alerts and updates will appear here"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const meta = TYPE_LABEL[n.type] || TYPE_LABEL.info;
            return (
              <div
                key={n.id}
                className={cn(
                  "bg-white rounded-xl border border-border p-4 flex gap-3 transition-colors group",
                  !n.read && "border-primary/30 bg-primary/5",
                )}
              >
                <span className="text-2xl shrink-0">{n.icon || "🔔"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={cn("text-sm font-semibold", !n.read ? "text-foreground" : "text-muted-foreground")}>
                        {n.title}
                      </p>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border font-medium", meta.color)}>
                        {ar ? meta.ar : meta.en}
                      </span>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!n.read && (
                        <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => handleMarkRead(n.id)} title={ar ? "تعليم كمقروء" : "Mark read"}>
                          <Check className="w-3.5 h-3.5 text-green-500" />
                        </Button>
                      )}
                      {n.link && (
                        <a href={n.link}>
                          <Button variant="ghost" size="icon" className="w-6 h-6">
                            <ExternalLink className="w-3.5 h-3.5 text-primary" />
                          </Button>
                        </a>
                      )}
                      <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => handleDelete(n.id, !n.read)} title={ar ? "حذف" : "Delete"}>
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{n.body}</p>
                  <p className="text-xs text-muted-foreground/50 mt-1.5">{timeAgo(n.createdAt, ar)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
