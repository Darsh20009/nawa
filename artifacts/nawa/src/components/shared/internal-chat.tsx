import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { useListConversations, useGetChatMessages, useSendChatMessage, useListEmployees, useCreateConversation } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User, Search, MessageSquare, Camera, Smile, Plus, Image as ImageIcon, Wifi, WifiOff, Check, CheckCheck, MoreVertical, X, Sparkles, Phone, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useChatSocket } from "@/hooks/use-chat-socket";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const EMOJIS = ["😀","😂","🥰","😎","🤩","👏","🔥","💯","✨","💼","🏠","🏢","🏗️","🤝","✅","👍","🙏","🎉","💎","⚡"];

const playPop = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 1100;
    o.type = "sine";
    g.gain.setValueAtTime(0.18, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    o.start();
    o.stop(ctx.currentTime + 0.18);
  } catch { /* noop */ }
};

function formatChatTime(d: Date) {
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
}

function avatarColor(seed: string) {
  const hues = [340, 280, 220, 180, 140, 30, 10, 260];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `hsl(${hues[h % hues.length]}, 70%, 55%)`;
}

export function InternalChat() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();
  const [typingByConv, setTypingByConv] = useState<Record<string, { userName: string; until: number }[]>>({});
  const [search, setSearch] = useState("");

  const t = (ar: string, en: string) => language === "ar" ? ar : en;

  const { data: conversations } = useListConversations({
    query: { queryKey: ["conversations"], refetchInterval: 30000 }
  });

  const { data: messages } = useGetChatMessages(activeConvId || "", {
    query: { enabled: !!activeConvId, queryKey: ["messages", activeConvId] }
  });

  const { data: employees } = useListEmployees({ query: { queryKey: ["employees"] } });

  const createConv = useCreateConversation({
    mutation: {
      onSuccess: (newConv: any) => {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        setActiveConvId(newConv.id);
        setShowNewChat(false);
      }
    }
  });

  const handleIncoming = useCallback((conversationId: string, message: any) => {
    queryClient.setQueryData(["messages", conversationId], (old: any[] | undefined) => {
      if (!old) return [message];
      if (old.some(m => m.id === message.id)) return old;
      return [...old, message];
    });
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
    if (message.senderId !== user?.id) playPop();
  }, [queryClient, user?.id]);

  const handleTyping = useCallback((conversationId: string, userId: string, userName: string, isTyping: boolean) => {
    if (userId === user?.id) return;
    setTypingByConv(prev => {
      const next = { ...prev };
      const list = (next[conversationId] || []).filter(t => t.userName !== userName && t.until > Date.now());
      if (isTyping) list.push({ userName, until: Date.now() + 4000 });
      next[conversationId] = list;
      return next;
    });
  }, [user?.id]);

  const { connected, onlineUsers, sendTyping } = useChatSocket({
    onMessage: handleIncoming,
    onTyping: handleTyping,
  });

  // Sweep expired typing indicators
  useEffect(() => {
    const id = setInterval(() => {
      setTypingByConv(prev => {
        const next: typeof prev = {};
        for (const [k, v] of Object.entries(prev)) {
          const fresh = v.filter(t => t.until > Date.now());
          if (fresh.length) next[Number(k)] = fresh;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Autoscroll
  useEffect(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      });
    }
  }, [messages, activeConvId, typingByConv[activeConvId || ""]?.length]);

  const sendMutation = useSendChatMessage({
    mutation: {
      onSuccess: (msg: any) => {
        queryClient.setQueryData(["messages", activeConvId], (old: any[] | undefined) => {
          if (!old) return [msg];
          if (old.some(m => m.id === msg.id)) return old;
          return [...old, msg];
        });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }
    }
  });

  const handleSend = (textOverride?: string, type: "text" | "image" = "text", fileUrl?: string) => {
    const text = (textOverride ?? input).trim();
    if (!activeConvId) return;
    if (type === "text" && !text) return;

    sendMutation.mutate({
      id: activeConvId,
      data: { content: text || (type === "image" ? "📷 Image" : ""), type, fileUrl } as any
    });
    if (!textOverride) setInput("");
    setShowEmoji(false);
    sendTyping(activeConvId, false);
  };

  const handleInputChange = (v: string) => {
    setInput(v);
    if (!activeConvId) return;
    sendTyping(activeConvId, true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => sendTyping(activeConvId, false), 2000);
  };

  const uploadImage = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: t("الحجم كبير", "Too large"), description: t("الحد 10MB", "Max 10MB") });
      return;
    }
    setUploading(true);
    try {
      const metaRes = await fetch("/api/storage/uploads/request-url", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      const { uploadURL, objectPath } = await metaRes.json();
      await fetch(uploadURL, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      const url = `/api/storage${objectPath}`;
      handleSend("📷 " + file.name, "image", url);
    } catch {
      toast({ variant: "destructive", title: t("فشل الرفع", "Upload failed") });
    } finally {
      setUploading(false);
    }
  };

  const startConversation = (employeeId: number, employeeName: string) => {
    createConv.mutate({
      data: {
        title: employeeName,
        isGroup: false,
        participantIds: [user?.id, employeeId].filter(Boolean) as any,
      } as any
    });
  };

  const filteredConvs = useMemo(() => {
    if (!conversations) return [];
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(c =>
      c.title.toLowerCase().includes(q) || (c.lastMessage || "").toLowerCase().includes(q)
    );
  }, [conversations, search]);

  const activeConv = conversations?.find(c => c.id === activeConvId);
  const typingList = typingByConv[activeConvId || ""] || [];

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-gradient-to-br from-background via-background to-primary/5 rounded-2xl border border-border shadow-xl overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r rtl:border-r-0 rtl:border-l border-border flex flex-col shrink-0 bg-white">
        <div className="p-4 border-b border-border bg-gradient-to-br from-primary to-primary/90 text-white">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                {t("الدردشة", "Chats")}
                {connected ? <Wifi className="w-4 h-4 text-green-300" /> : <WifiOff className="w-4 h-4 text-red-300" />}
              </h2>
              <p className="text-[11px] text-white/70">{connected ? t("متصل", "Live") : t("جاري إعادة الاتصال...", "Reconnecting...")}</p>
            </div>
            <button onClick={() => setShowNewChat(true)} className="w-9 h-9 rounded-full bg-secondary hover:bg-secondary/90 text-white flex items-center justify-center transition-all hover:scale-105 shadow-lg">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3 text-white/60" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={t("بحث...", "Search...")}
              className="pl-9 rtl:pr-9 rtl:pl-3 bg-white/15 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-secondary" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {filteredConvs.length === 0 && (
            <div className="p-6 text-center text-muted-foreground text-sm">
              <MessageSquare className="w-10 h-10 mx-auto opacity-20 mb-2" />
              {t("لا توجد محادثات بعد", "No conversations yet")}
            </div>
          )}
          {filteredConvs.map((conv) => {
            const isActive = activeConvId === conv.id;
            return (
              <button key={conv.id} onClick={() => setActiveConvId(conv.id)}
                className={cn("w-full text-left p-3 border-b border-border/50 transition-all flex items-center gap-3",
                  isActive ? "bg-gradient-to-r rtl:bg-gradient-to-l from-primary/10 to-secondary/10" : "hover:bg-muted/40")}>
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md ring-2 ring-secondary/30"
                    style={{ background: avatarColor(conv.id) }}>
                    {conv.title.charAt(0).toUpperCase()}
                  </div>
                  {/* placeholder online dot — real presence inside thread */}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <h4 className="font-semibold text-sm line-clamp-1 text-foreground">{conv.title}</h4>
                    {conv.updatedAt && (
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2 rtl:ml-0 rtl:mr-2">
                        {formatChatTime(new Date(conv.updatedAt))}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <p className="text-xs text-muted-foreground line-clamp-1 flex-1">
                      {typingByConv[conv.id]?.length
                        ? <span className="text-secondary italic">{t("يكتب...", "typing...")}</span>
                        : conv.lastMessage || t("ابدأ المحادثة", "Start chatting")}
                    </p>
                    {conv.unreadCount ? (
                      <span className="min-w-5 h-5 px-1.5 bg-secondary text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                        {conv.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {activeConvId && activeConv ? (
          <>
            {/* Header */}
            <div className="px-5 py-3 border-b border-border bg-white/80 backdrop-blur-sm flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base shadow ring-2 ring-secondary/30"
                  style={{ background: avatarColor(activeConv.id) }}>
                  {activeConv.title.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 rtl:-right-auto rtl:-left-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground line-clamp-1">{activeConv.title}</h3>
                <p className="text-xs text-secondary font-medium">
                  {typingList.length > 0
                    ? <span className="flex items-center gap-1"><TypingDots />{typingList[0].userName} {t("يكتب", "is typing")}</span>
                    : <span className="text-green-600">{t("نشط الآن", "Active now")}</span>}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center text-primary"><Phone className="w-4 h-4" /></button>
                <button className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center text-primary"><Video className="w-4 h-4" /></button>
                <button className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"><MoreVertical className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-1"
              style={{ background: "linear-gradient(180deg, rgba(13,27,62,0.02) 0%, rgba(201,169,110,0.04) 100%)" }}>
              {messages?.length === 0 && (
                <div className="text-center text-muted-foreground py-16">
                  <Sparkles className="w-10 h-10 mx-auto mb-3 text-secondary opacity-60" />
                  <p className="font-medium">{t("ابدأ المحادثة!", "Say hi!")}</p>
                  <p className="text-xs mt-1">{t("أرسل أول رسالة لبدء المحادثة", "Send the first message")}</p>
                </div>
              )}
              <AnimatePresence initial={false}>
                {messages?.map((msg, i) => {
                  const isMe = msg.senderId === user?.id;
                  const prev = messages[i - 1];
                  const showAvatar = !isMe && (!prev || prev.senderId !== msg.senderId);
                  const showName = !isMe && showAvatar;
                  return (
                    <motion.div key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className={cn("flex gap-2 max-w-[78%]", isMe ? "ml-auto rtl:ml-0 rtl:mr-auto flex-row-reverse" : "")}>
                      {!isMe && (
                        <div className="w-8 h-8 shrink-0 mt-auto">
                          {showAvatar && (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow"
                              style={{ background: avatarColor(msg.senderId) }}>
                              {msg.senderName?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                            </div>
                          )}
                        </div>
                      )}
                      <div className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                        {showName && <p className="text-[10px] font-semibold text-muted-foreground mb-0.5 px-2">{msg.senderName}</p>}
                        <div className={cn("px-4 py-2.5 rounded-2xl text-sm shadow-sm break-words",
                          isMe
                            ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-md rtl:rounded-br-2xl rtl:rounded-bl-md"
                            : "bg-white border border-border text-foreground rounded-bl-md rtl:rounded-bl-2xl rtl:rounded-br-md")}>
                          {msg.type === "image" && msg.fileUrl ? (
                            <button onClick={() => setImagePreview(msg.fileUrl!)} className="block">
                              <img src={msg.fileUrl} alt="" className="max-w-[260px] rounded-lg" />
                            </button>
                          ) : (
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          )}
                        </div>
                        <div className={cn("flex items-center gap-1 px-2 mt-0.5 text-[10px] text-muted-foreground", isMe ? "flex-row-reverse" : "")}>
                          <span>{msg.createdAt ? format(new Date(msg.createdAt), "HH:mm") : ""}</span>
                          {isMe && <CheckCheck className="w-3 h-3 text-secondary" />}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {typingList.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 max-w-[78%]">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold mt-auto">
                    {typingList[0].userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="bg-white border border-border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <TypingDots />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-border relative">
              <AnimatePresence>
                {showEmoji && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-3 mb-2 bg-white border border-border rounded-2xl shadow-xl p-3 grid grid-cols-10 gap-1 z-10">
                    {EMOJIS.map(e => (
                      <button key={e} onClick={() => { setInput(prev => prev + e); setShowEmoji(false); }}
                        className="w-8 h-8 rounded-lg hover:bg-muted text-xl transition-colors">{e}</button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="w-10 h-10 rounded-full bg-secondary/10 hover:bg-secondary/20 text-secondary flex items-center justify-center transition-all shrink-0">
                  {uploading ? <span className="text-xs">...</span> : <ImageIcon className="w-5 h-5" />}
                </button>
                <button type="button" onClick={() => setShowEmoji(s => !s)}
                  className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center transition-all shrink-0">
                  <Smile className="w-5 h-5" />
                </button>
                <Input value={input} onChange={(e) => handleInputChange(e.target.value)}
                  placeholder={t("اكتب رسالة...", "Type a message...")}
                  className="flex-1 rounded-full bg-muted/40 border-none focus-visible:ring-2 focus-visible:ring-secondary h-10" />
                <Button type="submit" size="icon"
                  className="rounded-full shrink-0 w-10 h-10 bg-gradient-to-br from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary disabled:opacity-50"
                  disabled={!input.trim() || sendMutation.isPending}>
                  <Send className="w-4 h-4 rtl:-scale-x-100" />
                </Button>
              </form>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 text-muted-foreground flex-col gap-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
              <MessageSquare className="w-12 h-12 text-primary/40" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">{t("مرحباً بك في الدردشة", "Welcome to Chat")}</p>
              <p className="text-sm mt-1">{t("اختر محادثة أو ابدأ واحدة جديدة", "Pick a chat or start a new one")}</p>
            </div>
            <Button onClick={() => setShowNewChat(true)} className="gap-2 rounded-full">
              <Plus className="w-4 h-4" /> {t("محادثة جديدة", "New Chat")}
            </Button>
          </div>
        )}
      </div>

      {/* New Chat Dialog */}
      <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{t("محادثة جديدة", "New Chat")}</DialogTitle>
            <DialogDescription>{t("اختر زميلاً لبدء المحادثة", "Pick a teammate to start chatting")}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-1">
            {(employees || []).filter((e: any) => e.id !== user?.id).map((emp: any) => (
              <button key={emp.id} onClick={() => startConversation(emp.id, emp.name)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow"
                    style={{ background: avatarColor(emp.id) }}>
                    {emp.name?.charAt(0).toUpperCase()}
                  </div>
                  {onlineUsers.has(emp.id) && (
                    <div className="absolute -bottom-0.5 -right-0.5 rtl:-right-auto rtl:-left-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{emp.name}</p>
                  <p className="text-xs text-muted-foreground">{emp.position || emp.email}</p>
                </div>
                {onlineUsers.has(emp.id) && (
                  <span className="text-[10px] text-green-600 font-semibold">{t("متصل", "Online")}</span>
                )}
              </button>
            ))}
            {(!employees || employees.length <= 1) && (
              <p className="text-center py-8 text-sm text-muted-foreground">{t("لا يوجد زملاء بعد", "No teammates yet")}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image preview */}
      <Dialog open={!!imagePreview} onOpenChange={(o) => !o && setImagePreview(null)}>
        <DialogContent className="sm:max-w-[800px] p-2 bg-black border-none">
          {imagePreview && <img src={imagePreview} alt="" className="w-full max-h-[80vh] object-contain rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-0.5 items-center">
      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "120ms" }} />
      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "240ms" }} />
    </span>
  );
}
