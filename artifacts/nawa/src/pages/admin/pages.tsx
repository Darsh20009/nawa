import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useListPages, useCreatePage, useUpdatePage, useDeletePage } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function AdminPages() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);

  useEffect(() => {
    document.title = language === "ar" ? "إدارة الصفحات | منصة نوى العقارية" : "Manage Pages | Nawa Real Estate Platform";
  }, [language]);

  const { data: pages, isLoading } = useListPages();

  const defaultValues = {
    slug: "", title: "", titleAr: "", content: "", contentAr: "",
    metaTitle: "", metaDescription: "", metaDescriptionAr: "", published: false
  };

  const form = useForm({ defaultValues });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/pages"] });

  const createMut = useCreatePage({
    mutation: {
      onSuccess: () => { invalidate(); setIsOpen(false); toast({ title: language === "ar" ? "تمت الإضافة" : "Page Created" }); },
      onError: (err: any) => toast({ title: language === "ar" ? "خطأ" : "Error", description: err?.message, variant: "destructive" }),
    }
  });

  const updateMut = useUpdatePage({
    mutation: {
      onSuccess: () => { invalidate(); setIsOpen(false); toast({ title: language === "ar" ? "تم التحديث" : "Page Updated" }); },
      onError: () => toast({ title: language === "ar" ? "خطأ" : "Error", variant: "destructive" }),
    }
  });

  const deleteMut = useDeletePage({
    mutation: {
      onSuccess: () => { invalidate(); setDeleteSlug(null); toast({ title: language === "ar" ? "تم الحذف" : "Deleted" }); },
      onError: () => toast({ title: language === "ar" ? "خطأ" : "Error", variant: "destructive" }),
    }
  });

  const onSubmit = (data: any) => {
    if (editingSlug) {
      updateMut.mutate({ slug: editingSlug, data });
    } else {
      createMut.mutate({ data });
    }
  };

  const handleEdit = (page: any) => {
    form.reset(page);
    setEditingSlug(page.slug);
    setIsOpen(true);
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-border shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold font-serif text-foreground">
          {language === "ar" ? "إدارة الصفحات" : "Manage Pages"}
        </h1>
        <Button onClick={() => { form.reset(defaultValues); setEditingSlug(null); setIsOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          {language === "ar" ? "إضافة صفحة" : "Add Page"}
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{language === "ar" ? "الرابط" : "Slug"}</TableHead>
              <TableHead>{language === "ar" ? "العنوان" : "Title"}</TableHead>
              <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
              <TableHead className="text-right">{language === "ar" ? "إجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</TableCell></TableRow>
            ) : pages && pages.length > 0 ? pages.map((page) => (
              <TableRow key={page.id}>
                <TableCell>
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs text-primary font-mono">{page.slug}</code>
                </TableCell>
                <TableCell className="font-medium">{language === "ar" ? page.titleAr : page.title}</TableCell>
                <TableCell>
                  {page.published
                    ? <Badge variant="secondary" className="bg-green-100 text-green-700 border-0 text-xs">{language === "ar" ? "منشور" : "Published"}</Badge>
                    : <Badge variant="outline" className="text-xs">{language === "ar" ? "مسودة" : "Draft"}</Badge>}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(page)}><Edit className="w-4 h-4 text-secondary" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteSlug(page.slug)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">{language === "ar" ? "لا توجد صفحات" : "No pages found"}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSlug ? (language === "ar" ? "تعديل صفحة" : "Edit Page") : (language === "ar" ? "إضافة صفحة جديدة" : "Add New Page")}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="slug" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl><Input {...field} disabled={!!editingSlug} placeholder="e.g. about-us" className="font-mono" /></FormControl>
                    <FormDescription className="text-xs">{language === "ar" ? "معرّف الصفحة في الرابط" : "Used in the page URL"}</FormDescription>
                  </FormItem>
                )} />
                <FormField control={form.control} name="published" render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0 mt-6 border rounded-lg p-3">
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="cursor-pointer">{language === "ar" ? "منشور" : "Published"}</FormLabel>
                  </FormItem>
                )} />
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title (EN)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="titleAr" render={({ field }) => (<FormItem><FormLabel>العنوان (AR)</FormLabel><FormControl><Input {...field} dir="rtl" /></FormControl></FormItem>)} />
                <FormField control={form.control} name="metaTitle" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>Meta Title</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="metaDescription" render={({ field }) => (<FormItem><FormLabel>Meta Description (EN)</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="metaDescriptionAr" render={({ field }) => (<FormItem><FormLabel>وصف الـ Meta (AR)</FormLabel><FormControl><Textarea rows={2} {...field} dir="rtl" /></FormControl></FormItem>)} />
              </div>
              <FormField control={form.control} name="content" render={({ field }) => (<FormItem><FormLabel>Content (EN) — HTML supported</FormLabel><FormControl><Textarea rows={8} {...field} className="font-mono text-sm" /></FormControl></FormItem>)} />
              <FormField control={form.control} name="contentAr" render={({ field }) => (<FormItem><FormLabel>المحتوى (AR) — يدعم HTML</FormLabel><FormControl><Textarea rows={8} {...field} dir="rtl" className="font-mono text-sm" /></FormControl></FormItem>)} />
              <Button type="submit" className="w-full" disabled={createMut.isPending || updateMut.isPending}>
                {createMut.isPending || updateMut.isPending ? (language === "ar" ? "جاري الحفظ..." : "Saving...") : (language === "ar" ? "حفظ" : "Save")}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteSlug !== null} onOpenChange={(open) => !open && setDeleteSlug(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "تأكيد الحذف" : "Confirm Delete"}</DialogTitle>
            <DialogDescription>
              {language === "ar" ? `هل أنت متأكد من حذف الصفحة "${deleteSlug}"؟` : `Are you sure you want to delete the page "${deleteSlug}"?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteSlug(null)}>{language === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button variant="destructive" onClick={() => deleteSlug && deleteMut.mutate({ slug: deleteSlug })} disabled={deleteMut.isPending}>
              {language === "ar" ? "حذف" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
