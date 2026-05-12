import { Router, type IRouter } from "express";
import { Types } from "@workspace/db";
import { Conversation, ChatMessage, User } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { broadcastToConversation } from "../lib/chatSocket";

const router: IRouter = Router();
const isValidId = (id: string) => Types.ObjectId.isValid(id);

function isPrivileged(role: string | undefined) {
  return role === "admin" || role === "super_admin";
}

async function loadConvIfMember(convId: string, userId: string, role: string | undefined) {
  if (!isValidId(convId)) return null;
  const conv = await Conversation.findById(convId);
  if (!conv) return null;
  const ids = (conv.participants ?? []) as string[];
  if (isPrivileged(role) || ids.includes(userId)) return conv;
  return null;
}

router.get("/chat/conversations", requireAuth, async (req, res): Promise<void> => {
  const u = (req as any).user;
  const filter = isPrivileged(u.role) ? {} : { participants: u.id };
  const all = await Conversation.find(filter).sort({ updatedAt: -1 });
  res.json(all.map(c => c.toJSON()));
});

router.post("/chat/conversations", requireAuth, async (req, res): Promise<void> => {
  const u = (req as any).user;
  const { title, isGroup, participantIds } = req.body;
  const ids = Array.isArray(participantIds)
    ? Array.from(new Set([...participantIds.map((x: unknown) => String(x)), u.id]))
    : [u.id];
  const conv = await Conversation.create({
    title: String(title ?? "Chat").slice(0, 200),
    isGroup: isGroup ?? false,
    participants: ids,
  });
  res.status(201).json(conv.toJSON());
});

router.get("/chat/conversations/:id/messages", requireAuth, async (req, res): Promise<void> => {
  const u = (req as any).user;
  const id = String(req.params.id);
  if (!isValidId(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const conv = await loadConvIfMember(id, u.id, u.role);
  if (!conv) { res.status(403).json({ error: "Forbidden" }); return; }
  const results = await ChatMessage.find({ conversationId: id }).sort({ createdAt: 1 });
  res.json(results.map(m => m.toJSON()));
});

router.post("/chat/conversations/:id/messages", requireAuth, async (req, res): Promise<void> => {
  const u = (req as any).user;
  const id = String(req.params.id);
  if (!isValidId(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const conv = await loadConvIfMember(id, u.id, u.role);
  if (!conv) { res.status(403).json({ error: "Forbidden" }); return; }

  const user = await User.findById(u.id);

  const content = String(req.body?.content ?? "").slice(0, 5000);
  const type = req.body?.type === "image" ? "image" : "text";
  const fileUrl = typeof req.body?.fileUrl === "string" ? req.body.fileUrl.slice(0, 2048) : null;

  const msg = await ChatMessage.create({
    conversationId: new Types.ObjectId(id),
    senderId: u.id,
    senderName: user?.name || u.email,
    senderAvatar: user?.avatar,
    content,
    type,
    fileUrl,
  });

  await Conversation.findByIdAndUpdate(id, { lastMessage: content, updatedAt: new Date() });

  const dto = msg.toJSON();
  const recipientIds = (conv.participants ?? []) as string[];
  broadcastToConversation(id, recipientIds, { type: "message", conversationId: id, message: dto });

  res.status(201).json(dto);
});

export default router;
