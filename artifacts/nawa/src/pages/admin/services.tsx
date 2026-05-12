import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useListServices, useCreateService, useUpdateService, useDeleteService } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/shared/image-upload";
import * as Icons from "lucide-react";

export default function AdminServices() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    document.title = language === "ar" ? "إدارة الخدمات | نوى العقارية" : "Manage Services | Nawa Real Estate Platform";
  }, [language]);

  const { data: services, isLoading } = useListServices();

  const defaultValues = { title: "", titleAr: "", description: "", descriptionAr: "", icon: "", imageUrl: "", order: 0 };
  const form = useForm({ defaultValues });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/services"] });

  const createMut = useCreateService({
    mutation: {
      onSuccess: () => { invalidate(); setIsOpen(false); toast({ title: language === "ar" ? "تمت الإضافة" : "Service Added" }); },
      onError: () => toast({ title: language === "ar" ? "خطأ" : "Error", variant: "destructive" }),
    }
  });

  const updateMut = useUpdateService({
    mutation: {
      onSuccess: () => { invalidate(); setIsOpen(false); toast({ title: language === "ar" ? "تم التحديث" : "Service Updated" }); },
      onError: () => toast({ title: language === "ar" ? "خطأ" : "Error", variant: "destructive" }),
    }
  });

  const deleteMut = useDeleteService({
    mutation: {
      onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: language === "ar" ? "تم الحذف" : "Deleted" }); },
      onError: () => toast({ title: language === "ar" ? "خطأ" : "Error", variant: "destructive" }),
    }
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
        <Button onClick={() => { form.reset(defaultValues); setEditingId(null); setIsOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          {language === "ar" ? "إضافة خدمة" : "Add Service"}
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{language === "ar" ? "الأيقونة" : "Icon"}</TableHead>
              <TableHead>{language === "ar" ? "العنوان" : "Title"}</TableHead>
              <TableHead>{language === "ar" ? "الوصف" : "Description"}</TableHead>
              <TableHead>{language === "ar" ? "الترتيب" : "Order"}</TableHead>
              <TableHead className="text-right">{language === "ar" ? "إجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</TableCell></TableRow>
            ) : services && services.length > 0 ? services.map((service) => {
              const IconComponent = service.icon && (Icons as any)[service.icon] ? (Icons as any)[service.icon] : null;
              return (
                <TableRow key={service.id}>
                  <TableCell>
                    {IconComponent ? <IconComponent className="w-5 h-5 text-secondary" /> : <span className="text-xs text-muted-foreground">{service.icon || "—"}</span>}
                  </TableCell>
                  <TableCell className="font-medium">{language === "ar" ? service.titleAr : service.title}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">{language === "ar" ? service.descriptionAr : service.description}</TableCell>
                  <TableCell>{service.order}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(service)}><Edit className="w-4 h-4 text-secondary" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(service.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            }) : (
              <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">{language === "ar" ? "لا توجد خدمات" : "No services found"}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? (language === "ar" ? "تعديل خدمة" : "Edit Service") : (language === "ar" ? "إضافة خدمة جديدة" : "Add New Service")}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title (EN)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="titleAr" render={({ field }) => (<FormItem><FormLabel>العنوان (AR)</FormLabel><FormControl><Input {...field} dir="rtl" /></FormControl></FormItem>)} />
                <FormField control={form.control} name="icon" render={({ field }) => (<FormItem><FormLabel>{language === "ar" ? "الأيقونة (Lucide)" : "Icon (Lucide name)"}</FormLabel><FormControl><Input {...field} placeholder="e.g. Building2" /></FormControl></FormItem>)} />
                <FormField control={form.control} name="order" render={({ field }) => (<FormItem><FormLabel>{language === "ar" ? "ترتيب العرض" : "Display Order"}</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="imageUrl" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>{language === "ar" ? "صورة الخدمة" : "Service Image"}</FormLabel><FormControl><ImageUpload value={field.value} onChange={field.onChange} aspectRatio="video" /></FormControl></FormItem>)} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description (EN)</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="descriptionAr" render={({ field }) => (<FormItem><FormLabel>الوصف (AR)</FormLabel><FormControl><Textarea rows={3} {...field} dir="rtl" /></FormControl></FormItem>)} />
              <Button type="submit" className="w-full" disabled={createMut.isPending || updateMut.isPending}>
                {createMut.isPending || updateMut.isPending ? (language === "ar" ? "جاري الحفظ..." : "Saving...") : (language === "ar" ? "حفظ" : "Save")}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "تأكيد الحذف" : "Confirm Delete"}</DialogTitle>
            <DialogDescription>{language === "ar" ? "هل أنت متأكد من حذف هذه الخدمة؟" : "Are you sure you want to delete this service?"}</DialogDescription>
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
