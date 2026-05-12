import { WebSocketServer, WebSocket } from "ws";
import type { Server as HttpServer, IncomingMessage } from "http";
import { Conversation, Types } from "@workspace/db";
import { verifyToken } from "./auth";
import { logger } from "./logger";

interface ChatClient {
  ws: WebSocket;
  userId: string;
  email: string;
  role: string;
}

const clients = new Set<ChatClient>();

export type WsBroadcastPayload =
  | { type: "message"; conversationId: string; message: any }
  | { type: "typing"; conversationId: string; userId: string; userName: string; isTyping: boolean }
  | { type: "presence"; userId: string; online: boolean }
  | { type: "read"; conversationId: string; userId: string };

function isPrivileged(role: string | undefined) {
  return role === "admin" || role === "super_admin";
}

// Tiny in-memory cache of conversation -> participantIds
const convCache = new Map<string, { ids: string[]; until: number }>();
async function getParticipants(conversationId: string): Promise<string[]> {
  if (!Types.ObjectId.isValid(conversationId)) return [];
  const hit = convCache.get(conversationId);
  if (hit && hit.until > Date.now()) return hit.ids;
  try {
    const conv = await Conversation.findById(conversationId);
    const ids = ((conv?.participants ?? []) as any[]).map(String);
    convCache.set(conversationId, { ids, until: Date.now() + 30000 });
    return ids;
  } catch {
    return [];
  }
}

/** Broadcast a presence/global event to all connected clients (no per-conversation scoping). */
function broadcastGlobal(payload: WsBroadcastPayload): void {
  const message = JSON.stringify(payload);
  for (const c of clients) {
    if (c.ws.readyState !== WebSocket.OPEN) continue;
    try { c.ws.send(message); } catch { /* ignore */ }
  }
}

/** Broadcast scoped to authorized participants (and admins). */
export async function broadcastToConversation(
  conversationId: string,
  knownParticipantIds: string[] | null,
  payload: WsBroadcastPayload,
): Promise<void> {
  const ids = knownParticipantIds ?? await getParticipants(conversationId);
  const message = JSON.stringify(payload);
  for (const c of clients) {
    if (c.ws.readyState !== WebSocket.OPEN) continue;
    if (isPrivileged(c.role) || ids.includes(c.userId)) {
      try { c.ws.send(message); } catch { /* ignore */ }
    }
  }
}

export function attachChatSocket(server: HttpServer): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req: IncomingMessage, socket, head) => {
    const url = req.url || "";
    if (!url.startsWith("/api/ws/chat")) return;

    const token = new URL(url, "http://localhost").searchParams.get("token");
    if (!token) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    let payload: any;
    try {
      payload = verifyToken(token);
    } catch {
      payload = null;
    }
    if (!payload || !payload.id) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      const client: ChatClient = {
        ws,
        userId: String(payload.id),
        email: payload.email,
        role: payload.role,
      };
      clients.add(client);
      logger.info({ userId: client.userId }, "WS client connected");

      // Notify presence (global, not scoped to a conversation)
      broadcastGlobal({ type: "presence", userId: client.userId, online: true });

      ws.on("message", (raw) => {
        (async () => {
          try {
            const data = JSON.parse(raw.toString());
            const convId = data?.conversationId ? String(data.conversationId) : "";
            if (!convId || !Types.ObjectId.isValid(convId)) return;
            if (data.type !== "typing" && data.type !== "read") return;

            const participants = await getParticipants(convId);
            // Authorization: sender must be a participant (admins also allowed).
            if (!isPrivileged(client.role) && !participants.includes(client.userId)) return;

            if (data.type === "typing") {
              await broadcastToConversation(convId, participants, {
                type: "typing",
                conversationId: convId,
                userId: client.userId,
                userName: client.email,
                isTyping: !!data.isTyping,
              });
            } else if (data.type === "read") {
              await broadcastToConversation(convId, participants, {
                type: "read",
                conversationId: convId,
                userId: client.userId,
              });
            }
          } catch (err) {
            logger.warn({ err }, "WS message handling failed");
          }
        })().catch((err) => logger.warn({ err }, "WS message handler rejected"));
      });

      ws.on("close", () => {
        clients.delete(client);
        broadcastGlobal({ type: "presence", userId: client.userId, online: false });
      });
    });
  });

  logger.info("Chat WebSocket attached at /api/ws/chat");
}
