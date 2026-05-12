import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useListMessages, useUpdateMessage, useDeleteMessage } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminMessages() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState<any>(null);

  useEffect(() => {
    document.title = language === "ar" ? "رسائل العملاء | منصة نوى العقارية" : "Messages | Nawa Real Estate Platform";
  }, [language]);

  const { data: messages } = useListMessages();

  const updateMut = useUpdateMessage({
    mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["messages", "admin"] }); } }
  });

  const deleteMut = useDeleteMessage({
    mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["messages", "admin"] }); } }
  });

  const handleOpenMessage = (msg: any) => {
    setSelectedMessage(msg);
    if (msg.status === "unread") {
      updateMut.mutate({ id: msg.id, data: { status: "read" } });
    }
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-border shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold font-serif text-foreground">
          {language === "ar" ? "رسائل العملاء" : "Client Messages"}
        </h1>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sender</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages?.map((msg) => (
              <TableRow key={msg.id} className={msg.status === 'unread' ? 'bg-muted/50' : ''}>
                <TableCell className="font-medium">{msg.name}</TableCell>
                <TableCell>{msg.email}</TableCell>
                <TableCell>{msg.subject}</TableCell>
                <TableCell>{msg.createdAt ? format(new Date(msg.createdAt), 'MMM dd, yyyy') : ''}</TableCell>
                <TableCell>
                  <Badge variant={msg.status === 'unread' ? 'destructive' : 'secondary'}>{msg.status}</Badge>
                </TableCell>
                <TableCell className="text-right flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenMessage(msg)}>
                    <Eye className="w-4 h-4 text-primary" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate({ id: msg.id })}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={selectedMessage !== null} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.subject}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground border-b pb-4">
              <div><span className="font-semibold text-foreground">From:</span> {selectedMessage?.name}</div>
              <div><span className="font-semibold text-foreground">Email:</span> {selectedMessage?.email}</div>
              {selectedMessage?.phone && <div><span className="font-semibold text-foreground">Phone:</span> {selectedMessage?.phone}</div>}
              <div><span className="font-semibold text-foreground">Date:</span> {selectedMessage?.createdAt ? format(new Date(selectedMessage.createdAt), 'MMM dd, yyyy HH:mm') : ''}</div>
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