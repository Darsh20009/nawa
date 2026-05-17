import { useEffect, useRef, useState, useCallback } from "react";
import { notifyNewMessage, notifyNewEmail, notifyChatMessage, isSoundEnabled, setSoundEnabled } from "@/lib/sounds";

interface NotificationCounts {
  messages: number;
  emails: number;
  chat: number;
  total: number;
}

export interface AppNotification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  body: string;
  link?: string | null;
  icon?: string;
  read: boolean;
  createdAt: string;
}

const POLL_INTERVAL = 20000;
const BASE = () => (window as any).__NAWA_BASE_URL__ || "";
const TOKEN = () => localStorage.getItem("nawa_token") || "";

async function fetchCounts(): Promise<{ messages: number; emails: number; chat: number }> {
  if (!TOKEN()) return { messages: 0, emails: 0, chat: 0 };
  try {
    const res = await fetch(`${BASE()}/api/messages`, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN()}` },
    });
    let messages = 0;
    if (res.ok) {
      const data = await res.json();
      messages = Array.isArray(data) ? data.filter((m: any) => !m.read && m.status === "unread").length : 0;
    }
    return { messages, emails: 0, chat: 0 };
  } catch {
    return { messages: 0, emails: 0, chat: 0 };
  }
}

export async function fetchNotifications(): Promise<{ notifications: AppNotification[]; unreadCount: number }> {
  if (!TOKEN()) return { notifications: [], unreadCount: 0 };
  try {
    const res = await fetch(`${BASE()}/api/notifications?limit=30`, {
      headers: { Authorization: `Bearer ${TOKEN()}` },
    });
    if (!res.ok) return { notifications: [], unreadCount: 0 };
    return await res.json();
  } catch {
    return { notifications: [], unreadCount: 0 };
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  if (!TOKEN()) return;
  await fetch(`${BASE()}/api/notifications/${id}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${TOKEN()}` },
  }).catch(() => {});
}

export async function markAllNotificationsRead(): Promise<void> {
  if (!TOKEN()) return;
  await fetch(`${BASE()}/api/notifications/read-all`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${TOKEN()}` },
  }).catch(() => {});
}

export async function deleteNotification(id: string): Promise<void> {
  if (!TOKEN()) return;
  await fetch(`${BASE()}/api/notifications/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${TOKEN()}` },
  }).catch(() => {});
}

// ── In-app toast for WS notifications ────────────────────────────────────────
type WsNotifHandler = (notif: AppNotification) => void;
const wsHandlers = new Set<WsNotifHandler>();
export function onWsNotification(fn: WsNotifHandler): () => void {
  wsHandlers.add(fn);
  return () => { wsHandlers.delete(fn); };
}

export function useNotifications(enabled = true) {
  const [counts, setCounts] = useState<NotificationCounts>({ messages: 0, emails: 0, chat: 0, total: 0 });
  const [soundOn, setSoundState] = useState(() => isSoundEnabled());
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevRef = useRef({ messages: -1, emails: -1, chat: -1 });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const toggleSound = useCallback(() => {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundState(next);
  }, [soundOn]);

  const loadNotifications = useCallback(async () => {
    if (!enabled) return;
    const { notifications: n, unreadCount: u } = await fetchNotifications();
    setNotifications(n);
    setUnreadCount(u);
  }, [enabled]);

  const check = useCallback(async () => {
    if (!enabled) return;
    const { messages, emails, chat } = await fetchCounts();
    const prev = prevRef.current;
    if (prev.messages >= 0) {
      if (messages > prev.messages) notifyNewMessage();
      if (emails > prev.emails) notifyNewEmail();
      if (chat > prev.chat) notifyChatMessage();
    }
    prevRef.current = { messages, emails, chat };
    setCounts({ messages, emails, chat, total: messages + emails + chat });
  }, [enabled]);

  // WebSocket for real-time notifications
  useEffect(() => {
    if (!enabled) return;

    const token = TOKEN();
    if (!token) return;

    const base = BASE();
    const wsBase = base.replace(/^http/, "ws").replace(/\/$/, "");
    const wsUrl = `${wsBase}/api/ws/chat?token=${encodeURIComponent(token)}`;

    let ws: WebSocket;
    let dead = false;
    let retryTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      if (dead) return;
      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (evt) => {
          try {
            const data = JSON.parse(evt.data);
            if (data.type === "notification") {
              const notif: AppNotification = {
                id: String(Date.now()),
                type: data.notifType || "info",
                title: data.title,
                body: data.body,
                link: data.link,
                icon: data.icon || "🔔",
                read: false,
                createdAt: new Date().toISOString(),
              };
              setNotifications((prev) => [notif, ...prev.slice(0, 49)]);
              setUnreadCount((c) => c + 1);
              wsHandlers.forEach((fn) => fn(notif));
              // Reload from DB after brief delay so DB-saved version appears
              setTimeout(loadNotifications, 1500);
            }
          } catch {}
        };

        ws.onclose = () => {
          if (!dead) retryTimer = setTimeout(connect, 4000);
        };

        ws.onerror = () => ws.close();
      } catch {}
    };

    connect();

    return () => {
      dead = true;
      clearTimeout(retryTimer);
      wsRef.current?.close();
    };
  }, [enabled, loadNotifications]);

  useEffect(() => {
    if (!enabled) return;
    check();
    loadNotifications();
    timerRef.current = setInterval(() => { check(); loadNotifications(); }, POLL_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [check, loadNotifications, enabled]);

  return {
    counts,
    soundOn,
    toggleSound,
    refetch: check,
    notifications,
    unreadCount,
    loadNotifications,
  };
}

export function useAuthNotifications() {
  const token = typeof window !== "undefined" ? localStorage.getItem("nawa_token") : null;
  return useNotifications(!!token);
}
