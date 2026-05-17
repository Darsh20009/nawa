import { useState, useEffect, useCallback } from "react";
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from "@simplewebauthn/browser";
import { useAuth } from "@/hooks/use-auth";
import { setAuthTokenGetter } from "@workspace/api-client-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export function useBiometricSupport() {
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    setSupported(browserSupportsWebAuthn());
  }, []);
  return supported;
}

export function useBiometricLogin() {
  const { login: authLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginWithBiometric = useCallback(
    async (email: string, onSuccess: (user: any) => void) => {
      setLoading(true);
      setError(null);
      try {
        const optRes = await fetch(`${BASE}/api/auth/webauthn/login-options?email=${encodeURIComponent(email)}`);
        if (!optRes.ok) {
          const body = await optRes.json().catch(() => ({}));
          throw new Error(body.error || "لا يوجد بصمة مسجّلة لهذا الحساب");
        }
        const { userId, ...options } = await optRes.json();

        const authResp = await startAuthentication({ optionsJSON: options });

        const verRes = await fetch(`${BASE}/api/auth/webauthn/login-verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ response: authResp, userId }),
        });
        if (!verRes.ok) {
          const body = await verRes.json().catch(() => ({}));
          throw new Error(body.error || "فشل التحقق من البصمة");
        }
        const data = await verRes.json();
        authLogin(data.token, data.user);
        setAuthTokenGetter(() => data.token);
        onSuccess(data.user);
      } catch (err: any) {
        if (err?.name === "NotAllowedError") {
          setError("تم إلغاء التحقق من البصمة");
        } else {
          setError(err?.message || "فشل التحقق من البصمة");
        }
      } finally {
        setLoading(false);
      }
    },
    [authLogin],
  );

  return { loginWithBiometric, loading, error, setError };
}

export function useBiometricRegister() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);

  const registerBiometric = useCallback(async (token: string, deviceName?: string) => {
    setLoading(true);
    setError(null);
    try {
      const optRes = await fetch(`${BASE}/api/auth/webauthn/register-options`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!optRes.ok) throw new Error("فشل الحصول على خيارات التسجيل");
      const options = await optRes.json();

      const regResp = await startRegistration({ optionsJSON: options });

      const verRes = await fetch(`${BASE}/api/auth/webauthn/register-verify`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ response: regResp, deviceName: deviceName || "جهازي" }),
      });
      if (!verRes.ok) {
        const body = await verRes.json().catch(() => ({}));
        throw new Error(body.error || "فشل تسجيل البصمة");
      }
      setRegistered(true);
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
        setError("تم إلغاء تسجيل البصمة");
      } else {
        setError(err?.message || "فشل تسجيل البصمة");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { registerBiometric, loading, error, registered, setError };
}

export function useHasBiometric(email: string) {
  const [hasBiometric, setHasBiometric] = useState<boolean | null>(null);

  useEffect(() => {
    if (!email || !email.includes("@")) { setHasBiometric(null); return; }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${BASE}/api/auth/webauthn/login-options?email=${encodeURIComponent(email)}`,
          { signal: controller.signal },
        );
        setHasBiometric(res.ok);
      } catch {
        setHasBiometric(false);
      }
    }, 600);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [email]);

  return hasBiometric;
}
