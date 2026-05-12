import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Inbox, Send, Star, Trash2, RefreshCw, Mail, MailOpen,
  Paperclip, Reply, X, Search, PenSquare,
  AlertCircle, Loader2, ChevronDown
} from "lucide-react";

const NAWA_EMAIL_ACCOUNTS = [
  "ceo@nawainv.sa",
  "cob@nawainv.sa",
  "finance@nawainv.sa",
  "investment@nawainv.sa",
  "marketing@nawainv.sa",
  "support@nawainv.sa",
  "info@nawainv.sa",
];

interface EmailMessage {
  uid: number;
  seq: number;
  subject: string;
  from: string;
  to: string;
  date: string;
  seen: boolean;
  flagged: boolean;
  hasAttachment: boolean;
}

interface EmailDetail extends EmailMessage {
  source: string;
}

interface ComposeData {
  to: string;
  subject: string;
  body: string;
  cc: string;
}

interface AccountInfo {
  assignedAccount: string | null;
  isAdmin: boolean;
  allAccounts: string[];
}

function parseEmailBody(source: string): string {
  const lines = source.split("\n");
  let inHeader = true;
  const bodyLines: string[] = [];
  let isHtml = false;

  for (const line of lines) {
    if (inHeader) {
      if (line.trim() === "") { inHeader = false; continue; }
      if (line.toLowerCase().startsWith("content-type: text/html")) isHtml = true;
    } else {
      bodyLines.push(line);
    }
  }

  const body = bodyLines.join("\n");
  if (isHtml || body.includes("<html") || body.includes("<div") || body.includes("<p>")) {
    return body;
  }
  return `<pre style="white-space:pre-wrap;font-family:inherit;">${body}</pre>`;
}

export default function EmployeeEmail() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const ar = language === "ar";

  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [folder, setFolder] = useState("INBOX");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMsg, setSelectedMsg] = useState<EmailDetail | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [search, setSearch] = useState("");
  const [compose, setCompose] = useState(false);
  const [composeData, setComposeData] = useState<ComposeData>({ to: "", subject: "", body: "", cc: "" });
  const [sending, setSending] = useState(false);

  const authToken = localStorage.getItem("nawa_token");

  // Load account info on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/email/accounts-list", {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!res.ok) return;
        const data: AccountInfo = await res.json();
        setAccountInfo(data);
        setSelectedAccount(data.assignedAccount || (data.isAdmin ? data.allAccounts[0] || null : null));
      } catch {}
    };
    load();
  }, [authToken]);

  const effectiveAccount = selectedAccount;

  const buildParams = useCallback((extra: Record<string, string> = {}) => {
    const params = new URLSearchParams({ folder, page: page.toString(), limit: "25", ...extra });
    if (effectiveAccount) params.set("asAccount", effectiveAccount);
    return params.toString();
  }, [folder, page, effectiveAccount]);

  const fetchInbox = useCallback(async () => {
    if (!effectiveAccount) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/email/inbox?${buildParams()}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) {
        const j = await res.json();
        if (j.error === "no_email_assigned") {
          setError(ar ? "لم يتم تعيين حساب بريد إلكتروني لك. تواصل مع مسؤول النظام." : "No email account assigned to you. Contact your admin.");
        } else {
          throw new Error(j.error || "Failed to fetch emails");
        }
        return;
      }
      const data = await res.json();
      setMessages(data.messages || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [effectiveAccount, buildParams, authToken, ar]);

  useEffect(() => {
    if (effectiveAccount) fetchInbox();
  }, [fetchInbox, effectiveAccount]);

  const openMessage = async (uid: number) => {
    setLoadingMsg(true);
    try {
      const params = new URLSearchParams({ folder });
      if (effectiveAccount) params.set("asAccount", effectiveAccount);
      const res = await fetch(`/api/email/message/${uid}?${params}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error("Failed to load message");
      const data = await res.json();
      setSelectedMsg(data);
      setMessages(prev => prev.map(m => m.uid === uid ? { ...m, seen: true } : m));
    } catch (err: any) {
      toast({ variant: "destructive", title: ar ? "خطأ" : "Error", description: err.message });
    } finally {
      setLoadingMsg(false);
    }
  };

  const toggleFlag = async (uid: number, flagged: boolean) => {
    try {
      await fetch(`/api/email/flag/${uid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ folder, flag: "\\Flagged", add: !flagged, asAccount: effectiveAccount }),
      });
      setMessages(prev => prev.map(m => m.uid === uid ? { ...m, flagged: !flagged } : m));
    } catch {}
  };

  const deleteMessage = async (uid: number) => {
    try {
      const params = new URLSearchParams({ folder });
      if (effectiveAccount) params.set("asAccount", effectiveAccount);
      await fetch(`/api/email/message/${uid}?${params}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setMessages(prev => prev.filter(m => m.uid !== uid));
      if (selectedMsg?.uid === uid) setSelectedMsg(null);
      toast({ title: ar ? "تم الحذف" : "Deleted" });
    } catch (err: any) {
      toast({ variant: "destructive", title: ar ? "خطأ" : "Error", description: err.message });
    }
  };

  const sendEmail = async () => {
    if (!composeData.to || !composeData.subject || !composeData.body) {
      toast({ variant: "destructive", title: ar ? "تحقق من البيانات" : "Check fields", description: ar ? "المستلم والموضوع والرسالة مطلوبة" : "To, subject, and body are required" });
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ to: composeData.to, subject: composeData.subject, body: composeData.body, cc: composeData.cc, asAccount: effectiveAccount }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Send failed");
      toast({ title: ar ? "تم الإرسال بنجاح ✓" : "Sent successfully ✓" });
      setCompose(false);
      setComposeData({ to: "", subject: "", body: "", cc: "" });
    } catch (err: any) {
      toast({ variant: "destructive", title: ar ? "فشل الإرسال" : "Send failed", description: err.message });
    } finally {
      setSending(false);
    }
  };

  const replyTo = (msg: EmailDetail) => {
    setComposeData({
      to: msg.from.match(/<(.+)>/)?.[1] || msg.from,
      subject: `Re: ${msg.subject}`,
      body: `\n\n--- ${ar ? "رد على" : "Reply to"}: ${msg.from} ---\n`,
      cc: "",
    });
    setCompose(true);
  };

  const filtered = search
    ? messages.filter(m => m.subject.toLowerCase().includes(search.toLowerCase()) || m.from.toLowerCase().includes(search.toLowerCase()))
    : messages;

  const folders = [
    { id: "INBOX", label: ar ? "صندوق الوارد" : "Inbox", icon: Inbox },
    { id: "Sent", label: ar ? "المرسلة" : "Sent", icon: Send },
    { id: "Drafts", label: ar ? "المسودات" : "Drafts", icon: PenSquare },
    { id: "Trash", label: ar ? "المحذوفة" : "Trash", icon: Trash2 },
    { id: "Spam", label: ar ? "البريد العشوائي" : "Spam", icon: AlertCircle },
  ];

  const unread = messages.filter(m => !m.seen).length;

  useEffect(() => {
    document.title = ar ? "البريد الإلكتروني | نوى العقارية" : "Email | Nawa Real Estate";
  }, [ar]);

  // No account available
  if (accountInfo && !accountInfo.isAdmin && !accountInfo.assignedAccount) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] bg-white rounded-2xl border border-border shadow-sm">
        <Mail className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold mb-2">{ar ? "لا يوجد حساب بريد مُعيَّن" : "No Email Account Assigned"}</h2>
        <p className="text-muted-foreground text-sm text-center max-w-xs">
          {ar ? "لم يتم تعيين حساب بريد إلكتروني لك بعد. يرجى التواصل مع مسؤول النظام." : "No email account has been assigned to you yet. Please contact your system administrator."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Sidebar */}
      <div className="w-60 border-e border-border bg-muted/20 flex flex-col shrink-0">
        <div className="p-4 border-b border-border space-y-3">
          <Button className="w-full gap-2 shadow-sm" onClick={() => setCompose(true)} disabled={!effectiveAccount}>
            <PenSquare className="w-4 h-4" />
            {ar ? "رسالة جديدة" : "Compose"}
          </Button>

          {/* Account Picker */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              {ar ? "الحساب" : "Account"}
            </p>
            {accountInfo?.isAdmin ? (
              <Select value={selectedAccount || ""} onValueChange={v => { setSelectedAccount(v); setMessages([]); setSelectedMsg(null); setPage(1); }}>
                <SelectTrigger className="h-8 text-xs font-mono">
                  <SelectValue placeholder={ar ? "اختر حساباً" : "Select account"} />
                </SelectTrigger>
                <SelectContent>
                  {NAWA_EMAIL_ACCOUNTS.map(acc => (
                    <SelectItem key={acc} value={acc} className="text-xs font-mono">{acc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-xs text-foreground font-mono truncate bg-muted px-2 py-1.5 rounded-md" dir="ltr">
                {effectiveAccount || "—"}
              </p>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 p-2">
          <div className="space-y-0.5">
            {folders.map(f => {
              const Icon = f.icon;
              return (
                <button
                  key={f.id}
                  onClick={() => { setFolder(f.id); setPage(1); setSelectedMsg(null); }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-start",
                    folder === f.id ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted text-foreground/80"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 truncate">{f.label}</span>
                  {f.id === "INBOX" && unread > 0 && (
                    <Badge className="text-xs h-5 min-w-5 px-1 bg-secondary text-secondary-foreground">{unread}</Badge>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Messages List */}
      <div className="w-80 border-e border-border flex flex-col shrink-0">
        <div className="p-3 border-b border-border space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">{folders.find(f => f.id === folder)?.label} {total > 0 && <span className="text-muted-foreground font-normal">({total})</span>}</h2>
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={fetchInbox} disabled={loading}>
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={ar ? "بحث..." : "Search..."} className="ps-8 h-8 text-xs" />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
              <p className="text-sm text-destructive font-medium">{ar ? "تعذر الاتصال بالبريد" : "Could not connect to email"}</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={fetchInbox}>{ar ? "إعادة المحاولة" : "Retry"}</Button>
            </div>
          ) : !effectiveAccount ? (
            <div className="p-6 text-center text-muted-foreground">
              <Mail className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{ar ? "اختر حساباً للبدء" : "Select an account to start"}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Mail className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{ar ? "لا توجد رسائل" : "No messages"}</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filtered.map(msg => (
                <button
                  key={msg.uid}
                  onClick={() => openMessage(msg.uid)}
                  className={cn(
                    "w-full p-3 text-start hover:bg-muted/50 transition-colors",
                    selectedMsg?.uid === msg.uid && "bg-primary/5 border-s-2 border-primary",
                    !msg.seen && "bg-blue-50/50"
                  )}
                >
                  <div className="flex items-start gap-2 mb-1">
                    <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", msg.seen ? "bg-transparent" : "bg-primary")} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={cn("text-xs truncate", !msg.seen ? "font-semibold" : "font-medium text-muted-foreground")}>
                          {msg.from.replace(/<[^>]*>/, "").trim() || msg.from}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          {msg.hasAttachment && <Paperclip className="w-3 h-3 text-muted-foreground" />}
                          {msg.flagged && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                        </div>
                      </div>
                      <p className={cn("text-xs truncate", !msg.seen ? "font-semibold text-foreground" : "text-foreground/80")}>{msg.subject}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(msg.date).toLocaleDateString(ar ? "ar-SA" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {total > 25 && (
          <div className="p-2 border-t border-border flex items-center justify-between">
            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="text-xs h-7">{ar ? "السابق" : "Prev"}</Button>
            <span className="text-xs text-muted-foreground">{page}</span>
            <Button variant="ghost" size="sm" disabled={page * 25 >= total} onClick={() => setPage(p => p + 1)} className="text-xs h-7">{ar ? "التالي" : "Next"}</Button>
          </div>
        )}
      </div>

      {/* Message View */}
      <div className="flex-1 flex flex-col min-w-0">
        {loadingMsg ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : selectedMsg ? (
          <>
            <div className="p-4 border-b border-border bg-white">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h2 className="text-lg font-semibold leading-tight flex-1">{selectedMsg.subject}</h2>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => replyTo(selectedMsg)}>
                    <Reply className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => toggleFlag(selectedMsg.uid, selectedMsg.flagged)}>
                    <Star className={cn("w-4 h-4", selectedMsg.flagged ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground")} />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive" onClick={() => deleteMessage(selectedMsg.uid)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p><span className="font-medium text-foreground">{ar ? "من:" : "From:"}</span> {selectedMsg.from}</p>
                <p><span className="font-medium text-foreground">{ar ? "إلى:" : "To:"}</span> {selectedMsg.to}</p>
                <p><span className="font-medium text-foreground">{ar ? "التاريخ:" : "Date:"}</span> {new Date(selectedMsg.date).toLocaleString(ar ? "ar-SA" : "en-US")}</p>
              </div>
            </div>
            <ScrollArea className="flex-1 p-6">
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: parseEmailBody(selectedMsg.source) }}
              />
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MailOpen className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">{ar ? "اختر رسالة للعرض" : "Select a message"}</p>
            <p className="text-sm mt-1">{ar ? "انقر على رسالة من القائمة" : "Click a message from the list"}</p>
          </div>
        )}
      </div>

      {/* Compose Dialog */}
      <Dialog open={compose} onOpenChange={setCompose}>
        <DialogContent className="max-w-2xl" dir={ar ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenSquare className="w-5 h-5 text-primary" />
              {ar ? "رسالة جديدة" : "New Message"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg flex items-center gap-2">
              <span>{ar ? "من:" : "From:"}</span>
              {accountInfo?.isAdmin ? (
                <Select value={selectedAccount || ""} onValueChange={setSelectedAccount}>
                  <SelectTrigger className="h-7 text-xs font-mono flex-1 border-0 bg-transparent p-0 shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NAWA_EMAIL_ACCOUNTS.map(acc => (
                      <SelectItem key={acc} value={acc} className="text-xs font-mono">{acc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="font-mono text-foreground">{effectiveAccount}</span>
              )}
            </div>
            <Input
              placeholder={ar ? "إلى (البريد الإلكتروني)" : "To (email)"}
              value={composeData.to}
              onChange={e => setComposeData(d => ({ ...d, to: e.target.value }))}
              dir="ltr"
            />
            <Input
              placeholder={ar ? "نسخة (اختياري)" : "CC (optional)"}
              value={composeData.cc}
              onChange={e => setComposeData(d => ({ ...d, cc: e.target.value }))}
              dir="ltr"
            />
            <Input
              placeholder={ar ? "الموضوع" : "Subject"}
              value={composeData.subject}
              onChange={e => setComposeData(d => ({ ...d, subject: e.target.value }))}
            />
            <Textarea
              placeholder={ar ? "اكتب رسالتك هنا..." : "Write your message here..."}
              value={composeData.body}
              onChange={e => setComposeData(d => ({ ...d, body: e.target.value }))}
              className="min-h-[200px] resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCompose(false)}>{ar ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={sendEmail} disabled={sending} className="gap-2">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {ar ? "إرسال" : "Send"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
