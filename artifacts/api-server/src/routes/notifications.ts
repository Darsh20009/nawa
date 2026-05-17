import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";
import { Notification, PushSubscription } from "@workspace/db";
import { VAPID_PUBLIC_KEY } from "../lib/notify";
import { Types } from "@workspace/db";

const router: IRouter = Router();

// GET /notifications — list user's notifications (newest first, max 50)
router.get("/notifications", requireAuth, async (req, res): Promise<void> => {
  const userId = String((req as any).user.id);
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const unreadOnly = req.query.unread === "true";

  const filter: any = { userId };
  if (unreadOnly) filter.read = false;

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const unreadCount = await Notification.countDocuments({ userId, read: false });

  res.json({
    notifications: notifications.map((n: any) => ({
      id: String(n._id),
      type: n.type,
      title: n.title,
      body: n.body,
      link: n.link,
      icon: n.icon,
      read: n.read,
      tag: n.tag,
      createdAt: n.createdAt,
    })),
    unreadCount,
  });
});

// PATCH /notifications/:id/read — mark one as read
router.patch("/notifications/:id/read", requireAuth, async (req, res): Promise<void> => {
  const userId = String((req as any).user.id);
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  await Notification.updateOne({ _id: id, userId }, { read: true });
  res.json({ success: true });
});

// PATCH /notifications/read-all — mark all as read
router.patch("/notifications/read-all", requireAuth, async (req, res): Promise<void> => {
  const userId = String((req as any).user.id);
  await Notification.updateMany({ userId, read: false }, { read: true });
  res.json({ success: true });
});

// DELETE /notifications/:id — delete one
router.delete("/notifications/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = String((req as any).user.id);
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  await Notification.deleteOne({ _id: id, userId });
  res.json({ success: true });
});

// GET /notifications/vapid-key — get public VAPID key
router.get("/notifications/vapid-key", requireAuth, (_req, res): void => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// POST /notifications/push-subscribe — register push subscription
router.post("/notifications/push-subscribe", requireAuth, async (req, res): Promise<void> => {
  const userId = String((req as any).user.id);
  const { endpoint, keys } = req.body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    res.status(400).json({ error: "endpoint and keys (p256dh, auth) are required" });
    return;
  }

  await PushSubscription.findOneAndUpdate(
    { endpoint },
    {
      userId,
      endpoint,
      keys: { p256dh: keys.p256dh, auth: keys.auth },
      userAgent: req.headers["user-agent"]?.slice(0, 200) || null,
    },
    { upsert: true, new: true },
  );

  res.json({ success: true });
});

// DELETE /notifications/push-subscribe — unregister push subscription
router.delete("/notifications/push-subscribe", requireAuth, async (req, res): Promise<void> => {
  const userId = String((req as any).user.id);
  const { endpoint } = req.body;
  if (!endpoint) {
    res.status(400).json({ error: "endpoint is required" });
    return;
  }
  await PushSubscription.deleteOne({ userId, endpoint });
  res.json({ success: true });
});

export default router;
