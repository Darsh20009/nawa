import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useListProjects, useCreateProject, useUpdateProject, useDeleteProject } from "@workspace/api-client-react";
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

const statusOptions = [
  { value: "planning", labelEn: "Planning", labelAr: "تخطيط" },
  { value: "active", labelEn: "Active", labelAr: "نشط" },
  { value: "completed", labelEn: "Completed", labelAr: "مكتمل" },
  { value: "sold_out", labelEn: "Sold Out", labelAr: "مباع بالكامل" },
];

const statusColors: Record<string, string> = {
  planning: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-700",
  sold_out: "bg-red-100 text-red-700",
};

export default function AdminProjects() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    document.title = language === "ar" ? "إدارة المشاريع | منصة نوى العقارية" : "Manage Projects | Nawa Real Estate Platform";
  }, [language]);

  const { data: projects, isLoading } = useListProjects();

  const defaultValues = {
    title: "", titleAr: "", description: "", descriptionAr: "",
    location: "", locationAr: "", status: "planning", type: "",
    totalUnits: 0, availableUnits: 0, completionPercentage: 0,
    imageUrl: "", price: "", area: "", featured: false
  };

  const form = useForm({ defaultValues });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/projects"] });

  const createMut = useCreateProject({
    mutation: {
      onSuccess: () => {
        invalidate();
        setIsOpen(false);
        toast({ title: language === "ar" ? "تمت الإضافة" : "Project Added", description: language === "ar" ? "تمت إضافة المشروع بنجاح" : "Project was added successfully." });
      },
      onError: () => toast({ title: language === "ar" ? "خطأ" : "Error", description: language === "ar" ? "فشل في إضافة المشروع" : "Failed to add project.", variant: "destructive" }),
    }
  });

  const updateMut = useUpdateProject({
    mutation: {
      onSuccess: () => {
        invalidate();
        setIsOpen(false);
        toast({ title: language === "ar" ? "تم التحديث" : "Project Updated", description: language === "ar" ? "تم تحديث المشروع بنجاح" : "Project was updated successfully." });
      },
      onError: () => toast({ title: language === "ar" ? "خطأ" : "Error", description: language === "ar" ? "فشل في تحديث المشروع" : "Failed to update project.", variant: "destructive" }),
    }
  });

  const deleteMut = useDeleteProject({
    mutation: {
      onSuccess: () => {
        invalidate();
        setDeleteId(null);
        toast({ title: language === "ar" ? "تم الحذف" : "Deleted", description: language === "ar" ? "تم حذف المشروع" : "Project was deleted." });
      },
      onError: () => toast({ title: language === "ar" ? "خطأ" : "Error", description: language === "ar" ? "فشل في حذف المشروع" : "Failed to delete project.", variant: "destructive" }),
    }
  });

  const onSubmit = (data: any) => {
    const formattedData = {
      ...data,
      totalUnits: Number(data.totalUnits),
      availableUnits: Number(data.availableUnits),
      completionPercentage: Number(data.completionPercentage)
    };
    if (editingId) {
      updateMut.mutate({ id: editingId, data: formattedData });
    } else {
      createMut.mutate({ data: formattedData });
    }
  };

  const handleEdit = (project: any) => {
    form.reset(project);
    setEditingId(project.id);
    setIsOpen(true);
  };

  const handleAddNew = () => {
    form.reset(defaultValues);
    setEditingId(null);
    setIsOpen(true);
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-border shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold font-serif text-foreground">
          {language === "ar" ? "إدارة المشاريع" : "Manage Projects"}
        </h1>
        <Button onClick={handleAddNew} className="gap-2">
          <Plus className="w-4 h-4" />
          {language === "ar" ? "إضافة مشروع" : "Add Project"}
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{language === "ar" ? "العنوان" : "Title"}</TableHead>
              <TableHead>{language === "ar" ? "الموقع" : "Location"}</TableHead>
              <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
              <TableHead>{language === "ar" ? "الإنجاز" : "Progress"}</TableHead>
              <TableHead>{language === "ar" ? "مميز" : "Featured"}</TableHead>
              <TableHead className="text-right">{language === "ar" ? "إجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</TableCell></TableRow>
            ) : projects && projects.length > 0 ? projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{language === "ar" ? project.titleAr : project.title}</TableCell>
                <TableCell>{language === "ar" ? project.locationAr : project.location}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[project.status] || "bg-gray-100 text-gray-700"}`}>
                    {statusOptions.find(s => s.value === project.status)?.[language === "ar" ? "labelAr" : "labelEn"] || project.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-muted rounded-full h-1.5">
                      <div className="bg-secondary h-full rounded-full" style={{ width: `${project.completionPercentage || 0}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{project.completionPercentage || 0}%</span>
                  </div>
                </TableCell>
                <TableCell>{project.featured ? <Star className="w-4 h-4 fill-secondary text-secondary" /> : <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(project)}><Edit className="w-4 h-4 text-secondary" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(project.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">{language === "ar" ? "لا توجد مشاريع" : "No projects found"}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? (language === "ar" ? "تعديل مشروع" : "Edit Project") : (language === "ar" ? "إضافة مشروع جديد" : "Add New Project")}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title (EN)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="titleAr" render={({ field }) => (<FormItem><FormLabel>العنوان (AR)</FormLabel><FormControl><Input {...field} dir="rtl" /></FormControl></FormItem>)} />
                <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Location (EN)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="locationAr" render={({ field }) => (<FormItem><FormLabel>الموقع (AR)</FormLabel><FormControl><Input {...field} dir="rtl" /></FormControl></FormItem>)} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>{language === "ar" ? "الحالة" : "Status"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{language === "ar" ? s.labelAr : s.labelEn}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>{language === "ar" ? "النوع" : "Type"}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="totalUnits" render={({ field }) => (<FormItem><FormLabel>{language === "ar" ? "إجمالي الوحدات" : "Total Units"}</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="availableUnits" render={({ field }) => (<FormItem><FormLabel>{language === "ar" ? "الوحدات المتاحة" : "Available Units"}</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="completionPercentage" render={({ field }) => (<FormItem><FormLabel>{language === "ar" ? "نسبة الإنجاز %" : "Completion %"}</FormLabel><FormControl><Input type="number" min={0} max={100} {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>{language === "ar" ? "السعر" : "Price"}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="area" render={({ field }) => (<FormItem><FormLabel>{language === "ar" ? "المساحة" : "Area"}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="imageUrl" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>{language === "ar" ? "رابط الصورة" : "Image URL"}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description (EN)</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="descriptionAr" render={({ field }) => (<FormItem><FormLabel>الوصف (AR)</FormLabel><FormControl><Textarea rows={3} {...field} dir="rtl" /></FormControl></FormItem>)} />
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

      {/* Delete Confirmation */}
      <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "تأكيد الحذف" : "Confirm Delete"}</DialogTitle>
            <DialogDescription>{language === "ar" ? "هل أنت متأكد أنك تريد حذف هذا المشروع؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to delete this project? This action cannot be undone."}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>{language === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMut.mutate({ id: deleteId })} disabled={deleteMut.isPending}>
              {deleteMut.isPending ? (language === "ar" ? "جاري الحذف..." : "Deleting...") : (language === "ar" ? "حذف" : "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
