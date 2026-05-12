import { useEffect, useRef, useState, useCallback } from "react";
import { notifyNewMessage, notifyNewEmail, notifyChatMessage, isSoundEnabled, setSoundEnabled } from "@/lib/sounds";

interface NotificationCounts {
  messages: number;
  emails: number;
  chat: number;
  total: number;
}

const POLL_INTERVAL = 20000; // 20 seconds

async function fetchCounts(): Promise<{ messages: number; emails: number; chat: number }> {
  const token = typeof window !== "undefined" ? localStorage.getItem("nawa_token") : null;
  if (!token) return { messages: 0, emails: 0, chat: 0 };

  const base = (window as any).__NAWA_BASE_URL__ || "";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  try {
    const [msgRes] = await Promise.allSettled([
      fetch(`${base}/api/messages`, { headers }),
    ]);

    let messages = 0;

    if (msgRes.status === "fulfilled" && msgRes.value.ok) {
      const data = await msgRes.value.json();
      // count unread (no read field, just count total new)
      messages = Array.isArray(data) ? data.filter((m: any) => !m.read).length : 0;
    }

    return { messages, emails: 0, chat: 0 };
  } catch {
    return { messages: 0, emails: 0, chat: 0 };
  }
}

export function useNotifications(enabled = true) {
  const [counts, setCounts] = useState<NotificationCounts>({ messages: 0, emails: 0, chat: 0, total: 0 });
  const [soundOn, setSoundState] = useState(() => isSoundEnabled());
  const prevRef = useRef({ messages: -1, emails: -1, chat: -1 });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const toggleSound = useCallback(() => {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundState(next);
  }, [soundOn]);

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

  useEffect(() => {
    if (!enabled) return;
    check();
    timerRef.current = setInterval(check, POLL_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [check, enabled]);

  return { counts, soundOn, toggleSound, refetch: check };
}

export function useAuthNotifications() {
  const token = typeof window !== "undefined" ? localStorage.getItem("nawa_token") : null;
  return useNotifications(!!token);
}
