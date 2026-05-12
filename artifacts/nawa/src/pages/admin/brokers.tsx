import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useListBrokers, useCreateBroker, useUpdateBroker, useDeleteBroker } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminBrokers() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    document.title = language === "ar" ? "إدارة الوسطاء | منصة نوى العقارية" : "Manage Brokers | Nawa Real Estate Platform";
  }, [language]);

  const { data: brokers } = useListBrokers({
    query: { queryKey: ["brokers", "admin"] }
  });

  const form = useForm({
    defaultValues: {
      name: "", nameAr: "", email: "", phone: "",
      specialization: "", specializationAr: "", bio: "", bioAr: "",
      avatar: "", rating: 5, dealsCount: 0, active: true
    }
  });

  const createMut = useCreateBroker({
    mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["brokers", "admin"] }); setIsOpen(false); } }
  });

  const updateMut = useUpdateBroker({
    mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["brokers", "admin"] }); setIsOpen(false); } }
  });

  const deleteMut = useDeleteBroker({
    mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["brokers", "admin"] }); } }
  });

  const onSubmit = (data: any) => {
    const formattedData = {
        ...data,
        rating: Number(data.rating),
        dealsCount: Number(data.dealsCount)
    };
    if (editingId) {
      updateMut.mutate({ id: editingId, data: formattedData });
    } else {
      createMut.mutate({ data: formattedData });
    }
  };

  const handleEdit = (broker: any) => {
    form.reset(broker);
    setEditingId(broker.id);
    setIsOpen(true);
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-border shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold font-serif text-foreground">
          {language === "ar" ? "إدارة الوسطاء" : "Manage Brokers"}
        </h1>
        <Button onClick={() => { form.reset(); setEditingId(null); setIsOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          {language === "ar" ? "إضافة وسيط" : "Add Broker"}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{language === "ar" ? "الاسم" : "Name"}</TableHead>
              <TableHead>{language === "ar" ? "التخصص" : "Specialization"}</TableHead>
              <TableHead>{language === "ar" ? "التقييم" : "Rating"}</TableHead>
              <TableHead>{language === "ar" ? "نشط" : "Active"}</TableHead>
              <TableHead className="text-right">{language === "ar" ? "إجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brokers?.map((broker) => (
              <TableRow key={broker.id}>
                <TableCell className="font-medium">{language === "ar" ? broker.nameAr : broker.name}</TableCell>
                <TableCell>{language === "ar" ? broker.specializationAr : broker.specialization}</TableCell>
                <TableCell>{broker.rating}</TableCell>
                <TableCell>{broker.active ? "Yes" : "No"}</TableCell>
                <TableCell className="text-right flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(broker)}><Edit className="w-4 h-4 text-secondary" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate({ id: broker.id })}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Broker" : "Add Broker"}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name (EN)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="nameAr" render={({ field }) => (<FormItem><FormLabel>Name (AR)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="specialization" render={({ field }) => (<FormItem><FormLabel>Specialization (EN)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="specializationAr" render={({ field }) => (<FormItem><FormLabel>Specialization (AR)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="rating" render={({ field }) => (<FormItem><FormLabel>Rating</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="dealsCount" render={({ field }) => (<FormItem><FormLabel>Deals Count</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="avatar" render={({ field }) => (<FormItem><FormLabel>Avatar URL</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
              </div>
              <FormField control={form.control} name="bio" render={({ field }) => (<FormItem><FormLabel>Bio (EN)</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="bioAr" render={({ field }) => (<FormItem><FormLabel>Bio (AR)</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="active" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel>Active</FormLabel>
                </FormItem>
              )} />
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}