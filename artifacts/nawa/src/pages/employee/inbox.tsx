import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useListMessages, useUpdateMessage } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function Inbox() {
  const { language } = useLanguage();
  const [selectedMessage, setSelectedMessage] = useState<any>(null);

  useEffect(() => {
    document.title = language === "ar" ? "صندوق الوارد | منصة نوى العقارية" : "Inbox | Nawa Real Estate Platform";
  }, [language]);

  const { data: messages, isLoading, refetch } = useListMessages();

  const updateMessageMutation = useUpdateMessage({
    mutation: {
      onSuccess: () => refetch()
    }
  });

  const handleOpenMessage = (msg: any) => {
    setSelectedMessage(msg);
    if (msg.status === "unread") {
      updateMessageMutation.mutate({ id: msg.id, data: { status: "read" } });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unread': return <Badge variant="destructive">{language === "ar" ? "غير مقروء" : "Unread"}</Badge>;
      case 'read': return <Badge variant="secondary">{language === "ar" ? "مقروء" : "Read"}</Badge>;
      case 'archived': return <Badge variant="outline">{language === "ar" ? "مؤرشف" : "Archived"}</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-border">
      <h1 className="text-2xl font-bold font-serif text-foreground mb-4">
        {language === "ar" ? "صندوق الوارد" : "Inbox"}
      </h1>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === "ar" ? "المرسل" : "Sender"}</TableHead>
                <TableHead>{language === "ar" ? "الموضوع" : "Subject"}</TableHead>
                <TableHead>{language === "ar" ? "التاريخ" : "Date"}</TableHead>
                <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages && messages.length > 0 ? (
                messages.map((msg) => (
                  <TableRow 
                    key={msg.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleOpenMessage(msg)}
                  >
                    <TableCell className="font-medium">{msg.name}</TableCell>
                    <TableCell>{msg.subject}</TableCell>
                    <TableCell>{msg.createdAt ? format(new Date(msg.createdAt), 'MMM dd, yyyy HH:mm') : ''}</TableCell>
                    <TableCell>{getStatusBadge(msg.status || 'unread')}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    {language === "ar" ? "لا توجد رسائل" : "No messages found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={selectedMessage !== null} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.subject}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground border-b pb-4">
              <div>
                <span className="font-semibold text-foreground">{language === "ar" ? "المرسل:" : "From:"}</span> {selectedMessage?.name}
              </div>
              <div>
                <span className="font-semibold text-foreground">{language === "ar" ? "البريد الإلكتروني:" : "Email:"}</span> {selectedMessage?.email}
              </div>
              {selectedMessage?.phone && (
                <div>
                  <span className="font-semibold text-foreground">{language === "ar" ? "الهاتف:" : "Phone:"}</span> {selectedMessage?.phone}
                </div>
              )}
              <div>
                <span className="font-semibold text-foreground">{language === "ar" ? "التاريخ:" : "Date:"}</span> {selectedMessage?.createdAt ? format(new Date(selectedMessage.createdAt), 'MMM dd, yyyy HH:mm') : ''}
              </div>
            </div>
            <div className="whitespace-pre-wrap text-foreground leading-relaxed">
              {selectedMessage?.content}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}