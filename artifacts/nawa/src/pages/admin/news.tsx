import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useListNews, useCreateNewsArticle, useUpdateNewsArticle, useDeleteNewsArticle } from "@workspace/api-client-react";
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

export default function AdminNews() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    document.title = language === "ar" ? "المركز الإعلامي | منصة نوى العقارية" : "Media Center | Nawa Real Estate Platform";
  }, [language]);

  const { data: news } = useListNews();

  const form = useForm({
    defaultValues: {
      title: "", titleAr: "", content: "", contentAr: "",
      category: "news", imageUrl: "", featured: false, publishedAt: new Date().toISOString().split('T')[0]
    }
  });

  const createMut = useCreateNewsArticle({
    mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["news", "admin"] }); setIsOpen(false); } }
  });

  const updateMut = useUpdateNewsArticle({
    mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["news", "admin"] }); setIsOpen(false); } }
  });

  const deleteMut = useDeleteNewsArticle({
    mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["news", "admin"] }); } }
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
        <Button onClick={() => { form.reset(); setEditingId(null); setIsOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          {language === "ar" ? "إضافة خبر" : "Add News"}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{language === "ar" ? "العنوان" : "Title"}</TableHead>
              <TableHead>{language === "ar" ? "القسم" : "Category"}</TableHead>
              <TableHead>{language === "ar" ? "مميز" : "Featured"}</TableHead>
              <TableHead className="text-right">{language === "ar" ? "إجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {news?.map((article) => (
              <TableRow key={article.id}>
                <TableCell className="font-medium">{language === "ar" ? article.titleAr : article.title}</TableCell>
                <TableCell>{article.category}</TableCell>
                <TableCell>{article.featured ? "Yes" : "No"}</TableCell>
                <TableCell className="text-right flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(article)}><Edit className="w-4 h-4 text-secondary" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate({ id: article.id })}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit News" : "Add News"}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title (EN)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="titleAr" render={({ field }) => (<FormItem><FormLabel>Title (AR)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="imageUrl" render={({ field }) => (<FormItem><FormLabel>Image URL</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="publishedAt" render={({ field }) => (<FormItem><FormLabel>Published Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
              </div>
              <FormField control={form.control} name="content" render={({ field }) => (<FormItem><FormLabel>Content (EN)</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="contentAr" render={({ field }) => (<FormItem><FormLabel>Content (AR)</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="featured" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel>Featured News</FormLabel>
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