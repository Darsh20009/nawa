import { useEffect, useRef, useState, useCallback } from "react";

type WsEvent =
  | { type: "message"; conversationId: string; message: any }
  | { type: "typing"; conversationId: string; userId: string; userName: string; isTyping: boolean }
  | { type: "presence"; userId: string; online: boolean }
  | { type: "presence:init"; onlineIds: string[] }
  | { type: "read"; conversationId: string; userId: string }
  | { type: "pong" };

interface UseChatSocketOptions {
  onMessage?: (conversationId: string, message: any) => void;
  onTyping?: (conversationId: string, userId: string, userName: string, isTyping: boolean) => void;
}

export function useChatSocket({ onMessage, onTyping }: UseChatSocketOptions = {}) {
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReconnectRef = useRef(true);
  const onMessageRef = useRef(onMessage);
  const onTypingRef = useRef(onTyping);

  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { onTypingRef.current = onTyping; }, [onTyping]);

  const connect = useCallback(() => {
    if (!shouldReconnectRef.current) return;
    const token = localStorage.getItem("nawa_token");
    if (!token) return;

    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${proto}//${window.location.host}/api/ws/chat?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      if (!shouldReconnectRef.current) return;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      reconnectRef.current = setTimeout(() => {
        if (shouldReconnectRef.current) connect();
      }, 3000);
    };
    ws.onerror = () => { /* triggers onclose */ };
    ws.onmessage = (e) => {
      try {
        const data: WsEvent = JSON.parse(e.data);
        if (data.type === "message") {
          onMessageRef.current?.(data.conversationId, data.message);
        } else if (data.type === "typing") {
          onTypingRef.current?.(data.conversationId, data.userId, data.userName, data.isTyping);
        } else if (data.type === "presence") {
          setOnlineUsers((prev) => {
            const next = new Set(prev);
            if (data.online) next.add(data.userId); else next.delete(data.userId);
            return next;
          });
        } else if (data.type === "presence:init") {
          setOnlineUsers(new Set(data.onlineIds));
        }
      } catch { /* noop */ }
    };
  }, []);

  useEffect(() => {
    shouldReconnectRef.current = true;
    connect();
    return () => {
      shouldReconnectRef.current = false;
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
      try { wsRef.current?.close(); } catch { /* noop */ }
      wsRef.current = null;
    };
  }, [connect]);

  const sendTyping = useCallback((conversationId: string, isTyping: boolean) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "typing", conversationId, isTyping }));
    }
  }, []);

  const subscribe = useCallback((_conversationId: string) => {
    // Server-side authorization derives subscription from conversation membership;
    // no explicit subscribe call needed.
  }, []);

  return { connected, onlineUsers, sendTyping, subscribe };
}
