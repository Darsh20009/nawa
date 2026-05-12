import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useListServices, useCreateService, useUpdateService, useDeleteService } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import * as Icons from "lucide-react";

export default function AdminServices() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    document.title = language === "ar" ? "إدارة الخدمات | منصة نوى العقارية" : "Manage Services | Nawa Real Estate Platform";
  }, [language]);

  const { data: services } = useListServices({
    query: { queryKey: ["services", "admin"] }
  });

  const form = useForm({
    defaultValues: {
      title: "", titleAr: "", description: "", descriptionAr: "",
      icon: "", imageUrl: "", order: 0
    }
  });

  const createMut = useCreateService({
    mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["services", "admin"] }); setIsOpen(false); } }
  });

  const updateMut = useUpdateService({
    mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["services", "admin"] }); setIsOpen(false); } }
  });

  const deleteMut = useDeleteService({
    mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["services", "admin"] }); } }
  });

  const onSubmit = (data: any) => {
    const formattedData = { ...data, order: Number(data.order) };
    if (editingId) {
      updateMut.mutate({ id: editingId, data: formattedData });
    } else {
      createMut.mutate({ data: formattedData });
    }
  };

  const handleEdit = (service: any) => {
    form.reset(service);
    setEditingId(service.id);
    setIsOpen(true);
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-border shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold font-serif text-foreground">
          {language === "ar" ? "إدارة الخدمات" : "Manage Services"}
        </h1>
        <Button onClick={() => { form.reset(); setEditingId(null); setIsOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          {language === "ar" ? "إضافة خدمة" : "Add Service"}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{language === "ar" ? "العنوان" : "Title"}</TableHead>
              <TableHead>{language === "ar" ? "الأيقونة" : "Icon"}</TableHead>
              <TableHead className="text-right">{language === "ar" ? "إجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services?.map((service) => {
              const IconComponent = service.icon && (Icons as any)[service.icon] ? (Icons as any)[service.icon] : null;
              return (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{language === "ar" ? service.titleAr : service.title}</TableCell>
                  <TableCell>{IconComponent && <IconComponent className="w-5 h-5" />}</TableCell>
                  <TableCell className="text-right flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(service)}><Edit className="w-4 h-4 text-secondary" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate({ id: service.id })}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Service" : "Add Service"}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title (EN)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="titleAr" render={({ field }) => (<FormItem><FormLabel>Title (AR)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="icon" render={({ field }) => (<FormItem><FormLabel>Icon (Lucide name)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="order" render={({ field }) => (<FormItem><FormLabel>Order</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}