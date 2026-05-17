import webpush from "web-push";
import { Notification, PushSubscription, User } from "@workspace/db";
import { logger } from "./logger";

const VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ||
  "BDN4ChAPdn9f_-4ANPY5MtjcgkBDRta8YkK69GzmWeyESCioBTlsblQEA79J9zmPsMyVdBK5WwdwdGrmLHCSKtM";
const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  "dCqwA3cpqHGtbRxMmMo7CyDdIc0hXnNlE_XAkBNh_LU";
const VAPID_EMAIL = process.env.VAPID_EMAIL || "mailto:info@nawainv.sa";

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export { VAPID_PUBLIC_KEY };

// ── WebSocket push map ────────────────────────────────────────────────────────
// This map is populated by chatSocket.ts so we can send WS notifications here
type WsSender = (userId: string, payload: object) => void;
let _wsSender: WsSender | null = null;

export function registerWsSender(fn: WsSender) {
  _wsSender = fn;
}

function pushWs(userId: string, payload: object) {
  if (_wsSender) {
    try {
      _wsSender(userId, payload);
    } catch (err) {
      logger.warn({ err }, "WS push failed");
    }
  }
}

// ── Web Push ──────────────────────────────────────────────────────────────────
async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  opts: { link?: string; icon?: string; tag?: string } = {},
) {
  const subs = await PushSubscription.find({ userId });
  const dead: string[] = [];

  await Promise.allSettled(
    subs.map(async (sub) => {
      const payload = JSON.stringify({
        title,
        body,
        url: opts.link || "/",
        icon: "/icon-192.png",
        badge: "/favicon-32.png",
        tag: opts.tag || `notif-${Date.now()}`,
      });
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
          },
          payload,
          { TTL: 60 * 60 * 24 },
        );
      } catch (err: any) {
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          dead.push(sub.id);
        } else {
          logger.warn({ err: err?.message, endpoint: sub.endpoint }, "Push send failed");
        }
      }
    }),
  );

  if (dead.length > 0) {
    await PushSubscription.deleteMany({ _id: { $in: dead } });
    logger.info({ count: dead.length }, "Removed expired push subscriptions");
  }
}

// ── Core function: fireNotify ─────────────────────────────────────────────────
export interface NotifyOptions {
  link?: string;
  icon?: string;
  tag?: string;
  type?: "info" | "success" | "warning" | "error";
  skipPush?: boolean;
  skipWs?: boolean;
  skipDb?: boolean;
}

export async function fireNotify(
  userId: string,
  title: string,
  body: string,
  opts: NotifyOptions = {},
) {
  const {
    link,
    icon = "🔔",
    tag,
    type = "info",
    skipPush = false,
    skipWs = false,
    skipDb = false,
  } = opts;

  const tasks: Promise<any>[] = [];

  // Layer 1 — DB
  if (!skipDb) {
    tasks.push(
      Notification.create({ userId, type, title, body, link, icon, tag }).catch(
        (err) => logger.warn({ err }, "Notification DB insert failed"),
      ),
    );
  }

  // Layer 2 — WebSocket (real-time in-app)
  if (!skipWs) {
    pushWs(userId, { type: "notification", title, body, link, icon, notifType: type });
  }

  // Layer 3 — Web Push (off-app / mobile)
  if (!skipPush) {
    tasks.push(sendPushToUser(userId, title, body, { link, icon, tag }));
  }

  await Promise.allSettled(tasks);
}

// ── fireNotifyAdmins: broadcast to all admins & super_admins ─────────────────
export async function fireNotifyAdmins(
  title: string,
  body: string,
  opts: NotifyOptions = {},
) {
  try {
    const admins = await User.find(
      { role: { $in: ["admin", "super_admin"] }, active: true },
      { _id: 1 },
    ).lean();
    await Promise.allSettled(
      admins.map((a: any) => fireNotify(String(a._id), title, body, opts)),
    );
  } catch (err) {
    logger.warn({ err }, "fireNotifyAdmins failed");
  }
}
