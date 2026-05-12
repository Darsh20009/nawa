import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useAiChat } from "@workspace/api-client-react";
import { Bot, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  
  useEffect(() => {
    let i = 0;
    setDisplayed("");
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 15);
    return () => clearInterval(interval);
  }, [text]);

  return <span className="whitespace-pre-wrap leading-relaxed">{displayed}</span>;
}

export function AiChat() {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: language === "ar" ? "مرحباً! أنا مساعد نوى الذكي. كيف يمكنني مساعدتك اليوم؟" : "Hello! I am Nawa AI Assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const aiChatMutation = useAiChat({
    mutation: {
      onSuccess: (data) => {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      },
      onError: () => {
        setMessages(prev => [...prev, { role: 'assistant', content: language === "ar" ? "عذراً، حدث خطأ أثناء معالجة طلبك." : "Sorry, an error occurred while processing your request." }]);
      }
    }
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || aiChatMutation.isPending) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput("");
    
    aiChatMutation.mutate({
      data: {
        message: userMsg,
        history: messages.map(m => ({ role: m.role, content: m.content }))
      }
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border bg-primary text-primary-foreground flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-bold">{language === "ar" ? "مساعد نوى الذكي" : "Nawa AI Assistant"}</h2>
          <p className="text-xs text-primary-foreground/70">{language === "ar" ? "متصل" : "Online"}</p>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-3 max-w-[85%]",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  msg.role === 'user' ? "bg-secondary text-secondary-foreground" : "bg-primary/10 text-primary"
                )}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={cn(
                  "p-4 rounded-2xl text-sm",
                  msg.role === 'user' 
                    ? "bg-primary text-primary-foreground rounded-tr-none" 
                    : "bg-muted text-foreground rounded-tl-none"
                )}>
                  {msg.role === 'assistant' && i === messages.length - 1 && !aiChatMutation.isPending ? (
                    <TypewriterText text={msg.content} />
                  ) : (
                    <span className="whitespace-pre-wrap leading-relaxed">{msg.content}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {aiChatMutation.isPending && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3 max-w-[85%]"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-muted rounded-tl-none flex gap-1 items-center">
                <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-border bg-muted/30">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={language === "ar" ? "اسألني أي شيء..." : "Ask me anything..."}
            className="flex-1 rounded-full px-6 bg-white"
          />
          <Button 
            type="submit" 
            size="icon" 
            className="rounded-full shrink-0"
            disabled={!input.trim() || aiChatMutation.isPending}
          >
            <Send className="w-4 h-4 rtl:-scale-x-100" />
          </Button>
        </form>
      </div>
    </div>
  );
}