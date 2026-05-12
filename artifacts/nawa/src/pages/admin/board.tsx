import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useListBoardMembers, useCreateBoardMember, useUpdateBoardMember, useDeleteBoardMember } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminBoard() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    document.title = language === "ar" ? "إدارة مجلس الإدارة | منصة نوى العقارية" : "Manage Board | Nawa Real Estate Platform";
  }, [language]);

  const { data: members } = useListBoardMembers({
    query: { queryKey: ["boardMembers", "admin"] }
  });

  const form = useForm({
    defaultValues: {
      name: "", nameAr: "", position: "", positionAr: "",
      bio: "", bioAr: "", avatar: "", linkedIn: "", order: 0
    }
  });

  const createMut = useCreateBoardMember({
    mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["boardMembers", "admin"] }); setIsOpen(false); } }
  });

  const updateMut = useUpdateBoardMember({
    mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["boardMembers", "admin"] }); setIsOpen(false); } }
  });

  const deleteMut = useDeleteBoardMember({
    mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["boardMembers", "admin"] }); } }
  });

  const onSubmit = (data: any) => {
    const formattedData = { ...data, order: Number(data.order) };
    if (editingId) {
      updateMut.mutate({ id: editingId, data: formattedData });
    } else {
      createMut.mutate({ data: formattedData });
    }
  };

  const handleEdit = (member: any) => {
    form.reset(member);
    setEditingId(member.id);
    setIsOpen(true);
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-border shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold font-serif text-foreground">
          {language === "ar" ? "إدارة مجلس الإدارة" : "Manage Board Members"}
        </h1>
        <Button onClick={() => { form.reset(); setEditingId(null); setIsOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          {language === "ar" ? "إضافة عضو" : "Add Member"}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{language === "ar" ? "الاسم" : "Name"}</TableHead>
              <TableHead>{language === "ar" ? "المنصب" : "Position"}</TableHead>
              <TableHead>{language === "ar" ? "الترتيب" : "Order"}</TableHead>
              <TableHead className="text-right">{language === "ar" ? "إجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members?.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">{language === "ar" ? member.nameAr : member.name}</TableCell>
                <TableCell>{language === "ar" ? member.positionAr : member.position}</TableCell>
                <TableCell>{member.order}</TableCell>
                <TableCell className="text-right flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(member)}><Edit className="w-4 h-4 text-secondary" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate({ id: member.id })}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Board Member" : "Add Board Member"}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name (EN)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="nameAr" render={({ field }) => (<FormItem><FormLabel>Name (AR)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="position" render={({ field }) => (<FormItem><FormLabel>Position (EN)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="positionAr" render={({ field }) => (<FormItem><FormLabel>Position (AR)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="avatar" render={({ field }) => (<FormItem><FormLabel>Avatar URL</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="linkedIn" render={({ field }) => (<FormItem><FormLabel>LinkedIn URL</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="order" render={({ field }) => (<FormItem><FormLabel>Display Order</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
              </div>
              <FormField control={form.control} name="bio" render={({ field }) => (<FormItem><FormLabel>Bio (EN)</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="bioAr" render={({ field }) => (<FormItem><FormLabel>Bio (AR)</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl></FormItem>)} />
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}