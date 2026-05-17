import { useEffect, useRef, useCallback, useState } from "react";

const BASE = (window as any).__NAWA_BASE_URL__ || "";

function getToken() {
  return localStorage.getItem("nawa_token") || "";
}

async function fetchVapidKey(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/api/notifications/vapid-key`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) return null;
    const { publicKey } = await res.json();
    return publicKey || null;
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr.buffer;
}

async function registerPush(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

  try {
    const reg = await navigator.serviceWorker.ready;
    const vapidKey = await fetchVapidKey();
    if (!vapidKey) return false;

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    }

    const json = sub.toJSON();
    const res = await fetch(`${BASE}/api/notifications/push-subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: json.keys,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function usePushNotifications(enabled: boolean) {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const tried = useRef(false);

  useEffect(() => {
    setPushSupported("serviceWorker" in navigator && "PushManager" in window);
  }, []);

  useEffect(() => {
    if (!enabled || tried.current || !pushSupported) return;
    tried.current = true;

    const run = async () => {
      // Check existing permission
      const perm = Notification.permission;
      if (perm === "denied") return;

      if (perm === "granted") {
        const ok = await registerPush();
        setPushEnabled(ok);
        return;
      }

      // Don't auto-request: let the user click the bell to enable
    };

    run();
  }, [enabled, pushSupported]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!pushSupported) return false;
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return false;
      const ok = await registerPush();
      setPushEnabled(ok);
      return ok;
    } catch {
      return false;
    }
  }, [pushSupported]);

  return { pushEnabled, pushSupported, requestPermission };
}
