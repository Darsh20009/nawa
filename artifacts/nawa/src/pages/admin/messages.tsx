import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useListMessages, useUpdateMessage, useDeleteMessage } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Eye, Mail, MailOpen, Archive } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function AdminMessages() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    document.title = language === "ar" ? "رسائل العملاء | منصة نوى العقارية" : "Messages | Nawa Real Estate Platform";
  }, [language]);

  const { data: messages, isLoading } = useListMessages();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/messages"] });

  const updateMut = useUpdateMessage({
    mutation: {
      onSuccess: () => invalidate(),
      onError: () => toast({ title: language === "ar" ? "خطأ" : "Error", variant: "destructive" }),
    }
  });

  const deleteMut = useDeleteMessage({
    mutation: {
      onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: language === "ar" ? "تم الحذف" : "Deleted" }); },
      onError: () => toast({ title: language === "ar" ? "خطأ" : "Error", variant: "destructive" }),
    }
  });

  const handleOpenMessage = (msg: any) => {
    setSelectedMessage(msg);
    if (msg.status === "unread") {
      updateMut.mutate({ id: msg.id, data: { status: "read" } });
    }
  };

  const handleStatusChange = (id: number, status: string) => {
    updateMut.mutate({ id, data: { status } });
    toast({ title: language === "ar" ? "تم تحديث الحالة" : "Status Updated" });
  };

  const filteredMessages = messages?.filter(m => statusFilter === "all" || m.status === statusFilter) || [];

  const statusBadge = (status: string) => {
    switch (status) {
      case "unread": return <Badge variant="destructive" className="text-xs gap-1"><Mail className="w-3 h-3" />{language === "ar" ? "غير مقروء" : "Unread"}</Badge>;
      case "read": return <Badge variant="secondary" className="text-xs gap-1"><MailOpen className="w-3 h-3" />{language === "ar" ? "مقروء" : "Read"}</Badge>;
      case "archived": return <Badge variant="outline" className="text-xs gap-1"><Archive className="w-3 h-3" />{language === "ar" ? "مؤرشف" : "Archived"}</Badge>;
      default: return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const unreadCount = messages?.filter(m => m.status === "unread").length || 0;

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-border shadow-sm">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-serif text-foreground">
            {language === "ar" ? "رسائل العملاء" : "Client Messages"}
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {language === "ar" ? `${unreadCount} رسالة غير مقروءة` : `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}`}
            </p>
          )}
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === "ar" ? "الكل" : "All"}</SelectItem>
            <SelectItem value="unread">{language === "ar" ? "غير مقروء" : "Unread"}</SelectItem>
            <SelectItem value="read">{language === "ar" ? "مقروء" : "Read"}</SelectItem>
            <SelectItem value="archived">{language === "ar" ? "مؤرشف" : "Archived"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{language === "ar" ? "المرسل" : "Sender"}</TableHead>
              <TableHead>{language === "ar" ? "البريد الإلكتروني" : "Email"}</TableHead>
              <TableHead>{language === "ar" ? "الموضوع" : "Subject"}</TableHead>
              <TableHead>{language === "ar" ? "التاريخ" : "Date"}</TableHead>
              <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
              <TableHead className="text-right">{language === "ar" ? "إجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</TableCell></TableRow>
            ) : filteredMessages.length > 0 ? filteredMessages.map((msg) => (
              <TableRow key={msg.id} className={msg.status === "unread" ? "bg-primary/5 font-medium" : ""}>
                <TableCell>{msg.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{msg.email}</TableCell>
                <TableCell className="max-w-[200px] truncate">{msg.subject}</TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {msg.createdAt ? format(new Date(msg.createdAt), "MMM dd, yyyy") : "—"}
                </TableCell>
                <TableCell>{statusBadge(msg.status || "unread")}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenMessage(msg)} title={language === "ar" ? "عرض" : "View"}>
                      <Eye className="w-4 h-4 text-primary" />
                    </Button>
                    {msg.status !== "archived" && (
                      <Button variant="ghost" size="icon" onClick={() => handleStatusChange(msg.id, "archived")} title={language === "ar" ? "أرشفة" : "Archive"}>
                        <Archive className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(msg.id)} title={language === "ar" ? "حذف" : "Delete"}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">{language === "ar" ? "لا توجد رسائل" : "No messages"}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Message Detail Dialog */}
      <Dialog open={selectedMessage !== null} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-lg">{selectedMessage?.subject}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3 text-sm border rounded-lg p-4 bg-muted/30">
              <div><span className="font-semibold text-foreground">{language === "ar" ? "المرسل:" : "From:"}</span> <span className="text-muted-foreground">{selectedMessage?.name}</span></div>
              <div><span className="font-semibold text-foreground">{language === "ar" ? "البريد:" : "Email:"}</span> <span className="text-muted-foreground">{selectedMessage?.email}</span></div>
              {selectedMessage?.phone && <div><span className="font-semibold text-foreground">{language === "ar" ? "الهاتف:" : "Phone:"}</span> <span className="text-muted-foreground">{selectedMessage?.phone}</span></div>}
              <div><span className="font-semibold text-foreground">{language === "ar" ? "التاريخ:" : "Date:"}</span> <span className="text-muted-foreground">{selectedMessage?.createdAt ? format(new Date(selectedMessage.createdAt), "MMM dd, yyyy HH:mm") : ""}</span></div>
            </div>
            <div className="whitespace-pre-wrap text-foreground leading-relaxed p-4 border rounded-lg bg-white min-h-[100px]">
              {selectedMessage?.content}
            </div>
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                {selectedMessage?.status !== "archived" && (
                  <Button size="sm" variant="outline" onClick={() => { handleStatusChange(selectedMessage.id, "archived"); setSelectedMessage(null); }}>
                    <Archive className="w-4 h-4 mr-1" />
                    {language === "ar" ? "أرشفة" : "Archive"}
                  </Button>
                )}
                {selectedMessage?.status === "read" && (
                  <Button size="sm" variant="outline" onClick={() => { handleStatusChange(selectedMessage.id, "unread"); setSelectedMessage(null); }}>
                    <Mail className="w-4 h-4 mr-1" />
                    {language === "ar" ? "علّم كغير مقروء" : "Mark Unread"}
                  </Button>
                )}
              </div>
              <a href={`mailto:${selectedMessage?.email}?subject=Re: ${selectedMessage?.subject}`}>
                <Button size="sm">{language === "ar" ? "رد بالبريد" : "Reply via Email"}</Button>
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "تأكيد الحذف" : "Confirm Delete"}</DialogTitle>
            <DialogDescription>{language === "ar" ? "هل أنت متأكد من حذف هذه الرسالة؟" : "Are you sure you want to delete this message?"}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>{language === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMut.mutate({ id: deleteId })} disabled={deleteMut.isPending}>
              {language === "ar" ? "حذف" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
