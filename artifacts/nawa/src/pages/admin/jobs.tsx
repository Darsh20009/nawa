import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useListJobs, useCreateJob, useUpdateJob, useDeleteJob } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const jobTypes = [
  { value: "full-time", labelEn: "Full Time", labelAr: "دوام كامل" },
  { value: "part-time", labelEn: "Part Time", labelAr: "دوام جزئي" },
  { value: "contract", labelEn: "Contract", labelAr: "عقد" },
  { value: "remote", labelEn: "Remote", labelAr: "عن بُعد" },
];

export default function AdminJobs() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    document.title = language === "ar" ? "إدارة الوظائف | منصة نوى العقارية" : "Manage Jobs | Nawa Real Estate Platform";
  }, [language]);

  const { data: jobs, isLoading } = useListJobs();

  const defaultValues = {
    title: "", titleAr: "", description: "", descriptionAr: "",
    department: "", departmentAr: "", type: "full-time", location: "",
    requirements: "", requirementsAr: "", active: true
  };

  const form = useForm({ defaultValues });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });

  const createMut = useCreateJob({
    mutation: {
      onSuccess: () => { invalidate(); setIsOpen(false); toast({ title: language === "ar" ? "تمت الإضافة" : "Job Added" }); },
      onError: () => toast({ title: language === "ar" ? "خطأ" : "Error", variant: "destructive" }),
    }
  });

  const updateMut = useUpdateJob({
    mutation: {
      onSuccess: () => { invalidate(); setIsOpen(false); toast({ title: language === "ar" ? "تم التحديث" : "Job Updated" }); },
      onError: () => toast({ title: language === "ar" ? "خطأ" : "Error", variant: "destructive" }),
    }
  });

  const deleteMut = useDeleteJob({
    mutation: {
      onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: language === "ar" ? "تم الحذف" : "Deleted" }); },
      onError: () => toast({ title: language === "ar" ? "خطأ" : "Error", variant: "destructive" }),
    }
  });

  const onSubmit = (data: any) => {
    if (editingId) {
      updateMut.mutate({ id: editingId, data });
    } else {
      createMut.mutate({ data });
    }
  };

  const handleEdit = (job: any) => {
    form.reset(job);
    setEditingId(job.id);
    setIsOpen(true);
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-border shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold font-serif text-foreground">
          {language === "ar" ? "إدارة الوظائف" : "Manage Jobs"}
        </h1>
        <Button onClick={() => { form.reset(defaultValues); setEditingId(null); setIsOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          {language === "ar" ? "إضافة وظيفة" : "Add Job"}
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{language === "ar" ? "المسمى الوظيفي" : "Title"}</TableHead>
              <TableHead>{language === "ar" ? "القسم" : "Department"}</TableHead>
              <TableHead>{language === "ar" ? "النوع" : "Type"}</TableHead>
              <TableHead>{language === "ar" ? "الموقع" : "Location"}</TableHead>
              <TableHead>{language === "ar" ? "الحالة" : "Active"}</TableHead>
              <TableHead className="text-right">{language === "ar" ? "إجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</TableCell></TableRow>
            ) : jobs && jobs.length > 0 ? jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">{language === "ar" ? job.titleAr : job.title}</TableCell>
                <TableCell>{language === "ar" ? job.departmentAr : job.department}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {jobTypes.find(t => t.value === job.type)?.[language === "ar" ? "labelAr" : "labelEn"] || job.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{job.location || "—"}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${job.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {job.active ? (language === "ar" ? "نشط" : "Active") : (language === "ar" ? "غير نشط" : "Inactive")}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(job)}><Edit className="w-4 h-4 text-secondary" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(job.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">{language === "ar" ? "لا توجد وظائف" : "No jobs found"}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? (language === "ar" ? "تعديل وظيفة" : "Edit Job") : (language === "ar" ? "إضافة وظيفة جديدة" : "Add New Job")}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title (EN)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="titleAr" render={({ field }) => (<FormItem><FormLabel>المسمى (AR)</FormLabel><FormControl><Input {...field} dir="rtl" /></FormControl></FormItem>)} />
                <FormField control={form.control} name="department" render={({ field }) => (<FormItem><FormLabel>Department (EN)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="departmentAr" render={({ field }) => (<FormItem><FormLabel>القسم (AR)</FormLabel><FormControl><Input {...field} dir="rtl" /></FormControl></FormItem>)} />
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem><FormLabel>{language === "ar" ? "نوع الوظيفة" : "Job Type"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {jobTypes.map(t => <SelectItem key={t.value} value={t.value}>{language === "ar" ? t.labelAr : t.labelEn}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>{language === "ar" ? "الموقع" : "Location"}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description (EN)</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="descriptionAr" render={({ field }) => (<FormItem><FormLabel>الوصف (AR)</FormLabel><FormControl><Textarea rows={3} {...field} dir="rtl" /></FormControl></FormItem>)} />
              <FormField control={form.control} name="requirements" render={({ field }) => (<FormItem><FormLabel>Requirements (EN)</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="requirementsAr" render={({ field }) => (<FormItem><FormLabel>المتطلبات (AR)</FormLabel><FormControl><Textarea rows={3} {...field} dir="rtl" /></FormControl></FormItem>)} />
              <FormField control={form.control} name="active" render={({ field }) => (
                <FormItem className="flex items-center gap-3 space-y-0 border rounded-lg p-3">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="cursor-pointer">{language === "ar" ? "وظيفة نشطة" : "Active Job"}</FormLabel>
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
            <DialogDescription>{language === "ar" ? "هل أنت متأكد من حذف هذه الوظيفة؟" : "Are you sure you want to delete this job?"}</DialogDescription>
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
