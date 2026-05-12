import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useListPages, useCreatePage, useUpdatePage, useDeletePage } from "@workspace/api-client-react";
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

export default function AdminPages() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  useEffect(() => {
    document.title = language === "ar" ? "إدارة الصفحات | منصة نوى العقارية" : "Manage Pages | Nawa Real Estate Platform";
  }, [language]);

  const { data: pages } = useListPages({
    query: { queryKey: ["pages", "admin"] }
  });

  const form = useForm({
    defaultValues: {
      slug: "", title: "", titleAr: "", content: "", contentAr: "",
      metaTitle: "", metaDescription: "", metaDescriptionAr: "", published: false
    }
  });

  const createMut = useCreatePage({
    mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pages", "admin"] }); setIsOpen(false); } }
  });

  const updateMut = useUpdatePage({
    mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pages", "admin"] }); setIsOpen(false); } }
  });

  const deleteMut = useDeletePage({
    mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pages", "admin"] }); } }
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
        <Button onClick={() => { form.reset(); setEditingSlug(null); setIsOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          {language === "ar" ? "إضافة صفحة" : "Add Page"}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{language === "ar" ? "الرابط" : "Slug"}</TableHead>
              <TableHead>{language === "ar" ? "العنوان" : "Title"}</TableHead>
              <TableHead>{language === "ar" ? "منشور" : "Published"}</TableHead>
              <TableHead className="text-right">{language === "ar" ? "إجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages?.map((page) => (
              <TableRow key={page.id}>
                <TableCell>{page.slug}</TableCell>
                <TableCell className="font-medium">{language === "ar" ? page.titleAr : page.title}</TableCell>
                <TableCell>{page.published ? "Yes" : "No"}</TableCell>
                <TableCell className="text-right flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(page)}><Edit className="w-4 h-4 text-secondary" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate({ slug: page.slug })}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingSlug ? "Edit Page" : "Add Page"}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="slug" render={({ field }) => (<FormItem><FormLabel>Slug</FormLabel><FormControl><Input {...field} disabled={!!editingSlug} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="published" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0 mt-8">
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel>Published</FormLabel>
                  </FormItem>
                )} />
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title (EN)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="titleAr" render={({ field }) => (<FormItem><FormLabel>Title (AR)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="metaTitle" render={({ field }) => (<FormItem><FormLabel>Meta Title</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <div />
                <FormField control={form.control} name="metaDescription" render={({ field }) => (<FormItem><FormLabel>Meta Description (EN)</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="metaDescriptionAr" render={({ field }) => (<FormItem><FormLabel>Meta Description (AR)</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl></FormItem>)} />
              </div>
              <FormField control={form.control} name="content" render={({ field }) => (<FormItem><FormLabel>Content (EN) - HTML/Markdown</FormLabel><FormControl><Textarea rows={6} {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="contentAr" render={({ field }) => (<FormItem><FormLabel>Content (AR) - HTML/Markdown</FormLabel><FormControl><Textarea rows={6} {...field} /></FormControl></FormItem>)} />
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}