import { WebSocketServer, WebSocket } from "ws";
import type { Server as HttpServer, IncomingMessage } from "http";
import { eq } from "drizzle-orm";
import { db, conversationsTable } from "@workspace/db";
import { verifyToken } from "./auth";
import { logger } from "./logger";

interface ChatClient {
  ws: WebSocket;
  userId: number;
  email: string;
  role: string;
}

const clients = new Set<ChatClient>();

export type WsBroadcastPayload =
  | { type: "message"; conversationId: number; message: any }
  | { type: "typing"; conversationId: number; userId: number; userName: string; isTyping: boolean }
  | { type: "presence"; userId: number; online: boolean }
  | { type: "read"; conversationId: number; userId: number };

function isPrivileged(role: string | undefined) {
  return role === "admin" || role === "super_admin";
}

function parseIds(s: string | null): number[] {
  if (!s) return [];
  try {
    const a = JSON.parse(s);
    if (!Array.isArray(a)) return [];
    return a.map(Number).filter(Number.isFinite);
  } catch { return []; }
}

// Tiny in-memory cache of conversation -> participantIds
const convCache = new Map<number, { ids: number[]; until: number }>();
async function getParticipants(conversationId: number): Promise<number[]> {
  const hit = convCache.get(conversationId);
  if (hit && hit.until > Date.now()) return hit.ids;
  const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, conversationId));
  const ids = parseIds(conv?.participants ?? null);
  convCache.set(conversationId, { ids, until: Date.now() + 30000 });
  return ids;
}

/** Broadcast scoped to authorized participants (and admins). */
export async function broadcastToConversation(
  conversationId: number,
  knownParticipantIds: number[] | null,
  payload: WsBroadcastPayload,
  excludeUserId?: number,
) {
  const ids = knownParticipantIds && knownParticipantIds.length
    ? knownParticipantIds
    : await getParticipants(conversationId);
  const allowed = new Set(ids);
  const data = JSON.stringify(payload);
  for (const c of clients) {
    if (c.ws.readyState !== WebSocket.OPEN) continue;
    const isMember = allowed.has(c.userId) || isPrivileged(c.role);
    if (!isMember) continue;
    if (excludeUserId !== undefined && c.userId === excludeUserId) continue;
    c.ws.send(data);
  }
}

function broadcastPresence(userId: number, online: boolean) {
  const payload: WsBroadcastPayload = { type: "presence", userId, online };
  const data = JSON.stringify(payload);
  for (const c of clients) {
    if (c.ws.readyState === WebSocket.OPEN && c.userId !== userId) c.ws.send(data);
  }
}

export function attachChatSocket(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request: IncomingMessage, socket, head) => {
    const url = request.url || "";
    if (!url.startsWith("/api/ws/chat")) return;

    const token = new URL(url, "http://x").searchParams.get("token") || "";
    const decoded = verifyToken(token);
    if (!decoded) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request, decoded);
    });
  });

  wss.on("connection", (ws: WebSocket, _req: IncomingMessage, decoded: any) => {
    const client: ChatClient = {
      ws,
      userId: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    clients.add(client);
    logger.info({ userId: client.userId, total: clients.size }, "chat ws connected");

    broadcastPresence(client.userId, true);

    const onlineIds = Array.from(new Set(Array.from(clients).map(c => c.userId)));
    ws.send(JSON.stringify({ type: "presence:init", onlineIds }));

    ws.on("message", async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "typing" && typeof msg.conversationId === "number") {
          const ids = await getParticipants(msg.conversationId);
          if (!ids.includes(client.userId) && !isPrivileged(client.role)) return;
          await broadcastToConversation(msg.conversationId, ids, {
            type: "typing",
            conversationId: msg.conversationId,
            userId: client.userId,
            userName: client.email,
            isTyping: !!msg.isTyping,
          }, client.userId);
        } else if (msg.type === "read" && typeof msg.conversationId === "number") {
          const ids = await getParticipants(msg.conversationId);
          if (!ids.includes(client.userId) && !isPrivileged(client.role)) return;
          await broadcastToConversation(msg.conversationId, ids, {
            type: "read",
            conversationId: msg.conversationId,
            userId: client.userId,
          });
        } else if (msg.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        }
      } catch (err) {
        logger.warn({ err }, "ws bad message");
      }
    });

    ws.on("close", () => {
      clients.delete(client);
      const stillOnline = Array.from(clients).some(c => c.userId === client.userId);
      if (!stillOnline) broadcastPresence(client.userId, false);
      logger.info({ userId: client.userId, total: clients.size }, "chat ws disconnected");
    });

    ws.on("error", (err) => logger.warn({ err, userId: client.userId }, "ws error"));
  });

  setInterval(() => {
    for (const c of clients) {
      if (c.ws.readyState === WebSocket.OPEN) {
        try { c.ws.ping(); } catch { /* noop */ }
      }
    }
  }, 30000);

  return wss;
}
