import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useListBrokers, useCreateBroker, useUpdateBroker, useDeleteBroker } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/shared/image-upload";

export default function AdminBrokers() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    document.title = language === "ar" ? "إدارة الوسطاء | نوى العقارية" : "Manage Brokers | Nawa Real Estate Platform";
  }, [language]);

  const { data: brokers, isLoading } = useListBrokers();

  const defaultValues = {
    name: "", nameAr: "", email: "", phone: "",
    specialization: "", specializationAr: "", bio: "", bioAr: "",
    avatar: "", rating: 5, dealsCount: 0, active: true
  };

  const form = useForm({ defaultValues });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/brokers"] });

  const createMut = useCreateBroker({
    mutation: {
      onSuccess: () => { invalidate(); setIsOpen(false); toast({ title: language === "ar" ? "تمت الإضافة" : "Broker Added" }); },
      onError: () => toast({ title: language === "ar" ? "خطأ" : "Error", variant: "destructive" }),
    }
  });

  const updateMut = useUpdateBroker({
    mutation: {
      onSuccess: () => { invalidate(); setIsOpen(false); toast({ title: language === "ar" ? "تم التحديث" : "Broker Updated" }); },
      onError: () => toast({ title: language === "ar" ? "خطأ" : "Error", variant: "destructive" }),
    }
  });

  const deleteMut = useDeleteBroker({
    mutation: {
      onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: language === "ar" ? "تم الحذف" : "Deleted" }); },
      onError: () => toast({ title: language === "ar" ? "خطأ" : "Error", variant: "destructive" }),
    }
  });

  const onSubmit = (data: any) => {
    const formattedData = { ...data, rating: Number(data.rating), dealsCount: Number(data.dealsCount) };
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
        <Button onClick={() => { form.reset(defaultValues); setEditingId(null); setIsOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          {language === "ar" ? "إضافة وسيط" : "Add Broker"}
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{language === "ar" ? "الاسم" : "Name"}</TableHead>
              <TableHead>{language === "ar" ? "التخصص" : "Specialization"}</TableHead>
              <TableHead>{language === "ar" ? "التقييم" : "Rating"}</TableHead>
              <TableHead>{language === "ar" ? "الصفقات" : "Deals"}</TableHead>
              <TableHead>{language === "ar" ? "نشط" : "Active"}</TableHead>
              <TableHead className="text-right">{language === "ar" ? "إجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</TableCell></TableRow>
            ) : brokers && brokers.length > 0 ? brokers.map((broker) => (
              <TableRow key={broker.id}>
                <TableCell className="font-medium">{language === "ar" ? broker.nameAr : broker.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{language === "ar" ? broker.specializationAr : broker.specialization}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-secondary text-secondary" />
                    <span className="text-sm font-medium">{broker.rating}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{broker.dealsCount}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${broker.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {broker.active ? (language === "ar" ? "نشط" : "Active") : (language === "ar" ? "غير نشط" : "Inactive")}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(broker)}><Edit className="w-4 h-4 text-secondary" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(broker.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">{language === "ar" ? "لا يوجد وسطاء" : "No brokers found"}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? (language === "ar" ? "تعديل وسيط" : "Edit Broker") : (language === "ar" ? "إضافة وسيط جديد" : "Add New Broker")}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name (EN)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="nameAr" render={({ field }) => (<FormItem><FormLabel>الاسم (AR)</FormLabel><FormControl><Input {...field} dir="rtl" /></FormControl></FormItem>)} />
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>{language === "ar" ? "الهاتف" : "Phone"}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="specialization" render={({ field }) => (<FormItem><FormLabel>Specialization (EN)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="specializationAr" render={({ field }) => (<FormItem><FormLabel>التخصص (AR)</FormLabel><FormControl><Input {...field} dir="rtl" /></FormControl></FormItem>)} />
                <FormField control={form.control} name="rating" render={({ field }) => (<FormItem><FormLabel>{language === "ar" ? "التقييم (1-5)" : "Rating (1-5)"}</FormLabel><FormControl><Input type="number" step="0.1" min={1} max={5} {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="dealsCount" render={({ field }) => (<FormItem><FormLabel>{language === "ar" ? "عدد الصفقات" : "Deals Count"}</FormLabel><FormControl><Input type="number" min={0} {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="avatar" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>{language === "ar" ? "الصورة الشخصية" : "Avatar"}</FormLabel><FormControl><ImageUpload value={field.value} onChange={field.onChange} variant="avatar" /></FormControl></FormItem>)} />
              </div>
              <FormField control={form.control} name="bio" render={({ field }) => (<FormItem><FormLabel>Bio (EN)</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="bioAr" render={({ field }) => (<FormItem><FormLabel>نبذة (AR)</FormLabel><FormControl><Textarea rows={3} {...field} dir="rtl" /></FormControl></FormItem>)} />
              <FormField control={form.control} name="active" render={({ field }) => (
                <FormItem className="flex items-center gap-3 space-y-0 border rounded-lg p-3">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="cursor-pointer">{language === "ar" ? "وسيط نشط" : "Active Broker"}</FormLabel>
                </FormItem>
              )} />
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
            <DialogDescription>{language === "ar" ? "هل أنت متأكد من حذف هذا الوسيط؟" : "Are you sure you want to delete this broker?"}</DialogDescription>
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
