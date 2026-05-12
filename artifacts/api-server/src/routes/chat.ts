import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { conversationsTable, chatMessagesTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { broadcastToConversation } from "../lib/chatSocket";

const router: IRouter = Router();

const msgDto = (m: typeof chatMessagesTable.$inferSelect) => ({
  ...m,
  createdAt: m.createdAt.toISOString(),
});

function parseParticipants(p: string | null): number[] {
  if (!p) return [];
  try {
    const arr = JSON.parse(p);
    if (!Array.isArray(arr)) return [];
    return arr.map((x) => Number(x)).filter((n) => Number.isFinite(n));
  } catch { return []; }
}

function isPrivileged(role: string | undefined) {
  return role === "admin" || role === "super_admin";
}

async function loadConvIfMember(convId: number, userId: number, role: string | undefined) {
  const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, convId));
  if (!conv) return null;
  const ids = parseParticipants(conv.participants);
  if (isPrivileged(role) || ids.includes(userId)) return conv;
  return null;
}

router.get("/chat/conversations", requireAuth, async (req, res): Promise<void> => {
  const u = (req as any).user;
  const all = await db.select().from(conversationsTable).orderBy(desc(conversationsTable.updatedAt));
  const visible = isPrivileged(u.role)
    ? all
    : all.filter(c => parseParticipants(c.participants).includes(u.id));
  res.json(visible.map(c => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  })));
});

router.post("/chat/conversations", requireAuth, async (req, res): Promise<void> => {
  const u = (req as any).user;
  const { title, isGroup, participantIds } = req.body;
  const ids = Array.isArray(participantIds)
    ? Array.from(new Set([...participantIds.map(Number).filter(Number.isFinite), u.id]))
    : [u.id];
  const [conv] = await db.insert(conversationsTable).values({
    title: String(title ?? "Chat").slice(0, 200),
    isGroup: isGroup ?? false,
    participants: JSON.stringify(ids),
  }).returning();
  res.status(201).json({ ...conv, createdAt: conv.createdAt.toISOString(), updatedAt: conv.updatedAt.toISOString() });
});

router.get("/chat/conversations/:id/messages", requireAuth, async (req, res): Promise<void> => {
  const u = (req as any).user;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const conv = await loadConvIfMember(id, u.id, u.role);
  if (!conv) { res.status(403).json({ error: "Forbidden" }); return; }
  const results = await db.select().from(chatMessagesTable)
    .where(eq(chatMessagesTable.conversationId, id))
    .orderBy(chatMessagesTable.createdAt);
  res.json(results.map(msgDto));
});

router.post("/chat/conversations/:id/messages", requireAuth, async (req, res): Promise<void> => {
  const u = (req as any).user;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const conv = await loadConvIfMember(id, u.id, u.role);
  if (!conv) { res.status(403).json({ error: "Forbidden" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, u.id));

  const content = String(req.body?.content ?? "").slice(0, 5000);
  const type = req.body?.type === "image" ? "image" : "text";
  const fileUrl = typeof req.body?.fileUrl === "string" ? req.body.fileUrl.slice(0, 2048) : null;

  const [msg] = await db.insert(chatMessagesTable).values({
    conversationId: id,
    senderId: u.id,
    senderName: user?.name || u.email,
    senderAvatar: user?.avatar,
    content,
    type,
    fileUrl,
  }).returning();

  await db.update(conversationsTable).set({
    lastMessage: content,
    updatedAt: new Date(),
  }).where(eq(conversationsTable.id, id));

  const dto = msgDto(msg);
  const recipientIds = parseParticipants(conv.participants);
  broadcastToConversation(id, recipientIds, { type: "message", conversationId: id, message: dto });

  res.status(201).json(dto);
});

export default router;
