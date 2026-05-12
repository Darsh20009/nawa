import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { useListConversations, useGetChatMessages, useSendChatMessage } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User, Search, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

const playBeep = () => {
  try {
    const ctx = new window.AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    o.start();
    o.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export function InternalChat() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [prevMessageCount, setPrevMessageCount] = useState<Record<number, number>>({});

  const { data: conversations } = useListConversations({
    query: {
      queryKey: ["conversations"],
      refetchInterval: 5000,
    }
  });

  const { data: messages } = useGetChatMessages(activeConvId || 0, {
    query: {
      enabled: !!activeConvId,
      queryKey: ["messages", activeConvId],
      refetchInterval: 3000,
    }
  });

  useEffect(() => {
    if (activeConvId && messages) {
      const count = messages.length;
      if (prevMessageCount[activeConvId] !== undefined && count > prevMessageCount[activeConvId]) {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.senderId !== user?.id) {
          playBeep();
        }
      }
      setPrevMessageCount(prev => ({ ...prev, [activeConvId]: count }));
      
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
  }, [messages, activeConvId, user?.id]);

  const sendMutation = useSendChatMessage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["messages", activeConvId] });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }
    }
  });

  const handleSend = () => {
    if (!input.trim() || !activeConvId) return;
    
    sendMutation.mutate({
      id: activeConvId,
      data: { content: input.trim() }
    });
    setInput("");
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r border-border flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3 text-muted-foreground" />
            <Input 
              placeholder={language === "ar" ? "بحث..." : "Search..."} 
              className="pl-9 rtl:pr-9 rtl:pl-3 bg-muted/50 border-none"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {conversations?.map((conv) => (
            <div 
              key={conv.id}
              onClick={() => setActiveConvId(conv.id)}
              className={cn(
                "p-4 border-b border-border cursor-pointer transition-colors hover:bg-muted/50",
                activeConvId === conv.id ? "bg-primary/5" : ""
              )}
            >
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-semibold text-sm line-clamp-1">{conv.title}</h4>
                {conv.updatedAt && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {format(new Date(conv.updatedAt), 'HH:mm')}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground line-clamp-1 flex-1">
                  {conv.lastMessage || (language === "ar" ? "لا توجد رسائل" : "No messages")}
                </p>
                {conv.unreadCount ? (
                  <span className="w-5 h-5 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center shrink-0 ml-2 rtl:mr-2 rtl:ml-0 font-bold">
                    {conv.unreadCount}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeConvId ? (
          <>
            <div className="p-4 border-b border-border bg-white flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {conversations?.find(c => c.id === activeConvId)?.title}
                </h3>
              </div>
            </div>
            
            <ScrollArea className="flex-1 p-4 bg-muted/10" ref={scrollRef}>
              <div className="space-y-4">
                {messages?.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div 
                      key={msg.id}
                      className={cn(
                        "flex gap-3 max-w-[75%]",
                        isMe ? "ml-auto flex-row-reverse" : ""
                      )}
                    >
                      {!isMe && (
                        <div className="w-8 h-8 rounded-full bg-secondary/20 text-secondary-foreground flex items-center justify-center shrink-0 text-xs font-bold mt-auto">
                          {msg.senderName?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                        </div>
                      )}
                      <div className={cn(
                        "p-3 rounded-2xl text-sm relative group",
                        isMe 
                          ? "bg-primary text-primary-foreground rounded-br-none" 
                          : "bg-white border border-border text-foreground rounded-bl-none"
                      )}>
                        {!isMe && msg.senderName && (
                          <p className="text-[10px] font-bold mb-1 opacity-70">{msg.senderName}</p>
                        )}
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        <span className={cn(
                          "text-[10px] mt-1 block",
                          isMe ? "text-primary-foreground/70 text-right rtl:text-left" : "text-muted-foreground text-left rtl:text-right"
                        )}>
                          {msg.createdAt ? format(new Date(msg.createdAt), 'HH:mm') : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            
            <div className="p-4 bg-white border-t border-border">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex gap-2"
              >
                <Input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={language === "ar" ? "اكتب رسالة..." : "Type a message..."}
                  className="flex-1 rounded-full bg-muted/50 border-none"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="rounded-full shrink-0"
                  disabled={!input.trim() || sendMutation.isPending}
                >
                  <Send className="w-4 h-4 rtl:-scale-x-100" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/10 text-muted-foreground flex-col gap-4">
            <MessageSquare className="w-12 h-12 opacity-20" />
            <p>{language === "ar" ? "اختر محادثة للبدء" : "Select a conversation to start"}</p>
          </div>
        )}
      </div>
    </div>
  );
}