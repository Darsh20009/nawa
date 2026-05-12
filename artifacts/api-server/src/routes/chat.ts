import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { conversationsTable, chatMessagesTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/chat/conversations", requireAuth, async (_req, res): Promise<void> => {
  const results = await db.select().from(conversationsTable).orderBy(desc(conversationsTable.updatedAt));
  res.json(results.map(c => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  })));
});

router.post("/chat/conversations", requireAuth, async (req, res): Promise<void> => {
  const { title, isGroup, participantIds } = req.body;
  const [conv] = await db.insert(conversationsTable).values({
    title,
    isGroup: isGroup ?? false,
    participants: JSON.stringify(participantIds || []),
  }).returning();
  res.status(201).json({ ...conv, createdAt: conv.createdAt.toISOString(), updatedAt: conv.updatedAt.toISOString() });
});

router.get("/chat/conversations/:id/messages", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const results = await db.select().from(chatMessagesTable)
    .where(eq(chatMessagesTable.conversationId, id))
    .orderBy(chatMessagesTable.createdAt);
  res.json(results.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })));
});

router.post("/chat/conversations/:id/messages", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const authUser = (req as any).user;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, authUser.id));

  const [msg] = await db.insert(chatMessagesTable).values({
    conversationId: id,
    senderId: authUser.id,
    senderName: user?.name || authUser.email,
    senderAvatar: user?.avatar,
    content: req.body.content,
    type: req.body.type || "text",
    fileUrl: req.body.fileUrl,
  }).returning();

  await db.update(conversationsTable).set({
    lastMessage: req.body.content,
    updatedAt: new Date(),
  }).where(eq(conversationsTable.id, id));

  res.status(201).json({ ...msg, createdAt: msg.createdAt.toISOString() });
});

export default router;
