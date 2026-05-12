import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useListNews, useCreateNewsArticle, useUpdateNewsArticle, useDeleteNewsArticle } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/shared/image-upload";
import { format } from "date-fns";

const categories = [
  { value: "news", labelEn: "News", labelAr: "أخبار" },
  { value: "article", labelEn: "Article", labelAr: "مقال" },
  { value: "press", labelEn: "Press Release", labelAr: "بيان صحفي" },
  { value: "update", labelEn: "Project Update", labelAr: "تحديث مشروع" },
];

export default function AdminNews() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    document.title = language === "ar" ? "المركز الإعلامي | نوى العقارية" : "Media Center | Nawa Real Estate Platform";
  }, [language]);

  const { data: news, isLoading } = useListNews();

  const defaultValues = {
    title: "", titleAr: "", content: "", contentAr: "",
    category: "news", imageUrl: "", featured: false,
    publishedAt: new Date().toISOString().split('T')[0]
  };

  const form = useForm({ defaultValues });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/news"] });

  const createMut = useCreateNewsArticle({
    mutation: {
      onSuccess: () => { invalidate(); setIsOpen(false); toast({ title: language === "ar" ? "تمت الإضافة" : "Article Added" }); },
      onError: () => toast({ title: language === "ar" ? "خطأ" : "Error", variant: "destructive" }),
    }
  });

  const updateMut = useUpdateNewsArticle({
    mutation: {
      onSuccess: () => { invalidate(); setIsOpen(false); toast({ title: language === "ar" ? "تم التحديث" : "Article Updated" }); },
      onError: () => toast({ title: language === "ar" ? "خطأ" : "Error", variant: "destructive" }),
    }
  });

  const deleteMut = useDeleteNewsArticle({
    mutation: {
      onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: language === "ar" ? "تم الحذف" : "Deleted" }); },
      onError: () => toast({ title: language === "ar" ? "خطأ" : "Error", variant: "destructive" }),
    }
  });

  const onSubmit = (data: any) => {
    const formattedData = {
      ...data,
      publishedAt: data.publishedAt ? new Date(data.publishedAt).toISOString() : new Date().toISOString()
    };
    if (editingId) {
      updateMut.mutate({ id: editingId, data: formattedData });
    } else {
      createMut.mutate({ data: formattedData });
    }
  };

  const handleEdit = (article: any) => {
    form.reset({
      ...article,
      publishedAt: article.publishedAt ? new Date(article.publishedAt).toISOString().split('T')[0] : ''
    });
    setEditingId(article.id);
    setIsOpen(true);
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-border shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold font-serif text-foreground">
          {language === "ar" ? "إدارة المركز الإعلامي" : "Manage Media Center"}
        </h1>
        <Button onClick={() => { form.reset(defaultValues); setEditingId(null); setIsOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          {language === "ar" ? "إضافة خبر" : "Add Article"}
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{language === "ar" ? "العنوان" : "Title"}</TableHead>
              <TableHead>{language === "ar" ? "القسم" : "Category"}</TableHead>
              <TableHead>{language === "ar" ? "تاريخ النشر" : "Published"}</TableHead>
              <TableHead>{language === "ar" ? "مميز" : "Featured"}</TableHead>
              <TableHead className="text-right">{language === "ar" ? "إجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</TableCell></TableRow>
            ) : news && news.length > 0 ? news.map((article) => (
              <TableRow key={article.id}>
                <TableCell className="font-medium max-w-[250px] truncate">{language === "ar" ? article.titleAr : article.title}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {categories.find(c => c.value === article.category)?.[language === "ar" ? "labelAr" : "labelEn"] || article.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{article.publishedAt ? format(new Date(article.publishedAt), "MMM dd, yyyy") : "—"}</TableCell>
                <TableCell>{article.featured ? <Star className="w-4 h-4 fill-secondary text-secondary" /> : <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(article)}><Edit className="w-4 h-4 text-secondary" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(article.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">{language === "ar" ? "لا توجد مقالات" : "No articles found"}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? (language === "ar" ? "تعديل مقال" : "Edit Article") : (language === "ar" ? "إضافة مقال جديد" : "Add New Article")}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title (EN)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="titleAr" render={({ field }) => (<FormItem><FormLabel>العنوان (AR)</FormLabel><FormControl><Input {...field} dir="rtl" /></FormControl></FormItem>)} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel>{language === "ar" ? "القسم" : "Category"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c.value} value={c.value}>{language === "ar" ? c.labelAr : c.labelEn}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="publishedAt" render={({ field }) => (<FormItem><FormLabel>{language === "ar" ? "تاريخ النشر" : "Publish Date"}</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="imageUrl" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>{language === "ar" ? "صورة الخبر" : "News Image"}</FormLabel><FormControl><ImageUpload value={field.value} onChange={field.onChange} aspectRatio="wide" /></FormControl></FormItem>)} />
              </div>
              <FormField control={form.control} name="content" render={({ field }) => (<FormItem><FormLabel>Content (EN)</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="contentAr" render={({ field }) => (<FormItem><FormLabel>المحتوى (AR)</FormLabel><FormControl><Textarea rows={5} {...field} dir="rtl" /></FormControl></FormItem>)} />
              <FormField control={form.control} name="featured" render={({ field }) => (
                <FormItem className="flex items-center gap-3 space-y-0 border rounded-lg p-3">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="cursor-pointer">{language === "ar" ? "عرضه في الصفحة الرئيسية" : "Feature on Homepage"}</FormLabel>
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
            <DialogDescription>{language === "ar" ? "هل أنت متأكد من حذف هذا المقال؟" : "Are you sure you want to delete this article?"}</DialogDescription>
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
