import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useListJobs, useCreateJob, useUpdateJob, useDeleteJob } from "@workspace/api-client-react";
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

export default function AdminJobs() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    document.title = language === "ar" ? "إدارة الوظائف | منصة نوى العقارية" : "Manage Jobs | Nawa Real Estate Platform";
  }, [language]);

  const { data: jobs } = useListJobs();

  const form = useForm({
    defaultValues: {
      title: "", titleAr: "", description: "", descriptionAr: "",
      department: "", departmentAr: "", type: "full-time", location: "",
      requirements: "", requirementsAr: "", active: true
    }
  });

  const createMut = useCreateJob({
    mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["jobs", "admin"] }); setIsOpen(false); } }
  });

  const updateMut = useUpdateJob({
    mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["jobs", "admin"] }); setIsOpen(false); } }
  });

  const deleteMut = useDeleteJob({
    mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["jobs", "admin"] }); } }
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
        <Button onClick={() => { form.reset(); setEditingId(null); setIsOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          {language === "ar" ? "إضافة وظيفة" : "Add Job"}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{language === "ar" ? "المسمى الوظيفي" : "Title"}</TableHead>
              <TableHead>{language === "ar" ? "القسم" : "Department"}</TableHead>
              <TableHead>{language === "ar" ? "النوع" : "Type"}</TableHead>
              <TableHead>{language === "ar" ? "الحالة" : "Active"}</TableHead>
              <TableHead className="text-right">{language === "ar" ? "إجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs?.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">{language === "ar" ? job.titleAr : job.title}</TableCell>
                <TableCell>{language === "ar" ? job.departmentAr : job.department}</TableCell>
                <TableCell>{job.type}</TableCell>
                <TableCell>{job.active ? "Yes" : "No"}</TableCell>
                <TableCell className="text-right flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(job)}><Edit className="w-4 h-4 text-secondary" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate({ id: job.id })}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Job" : "Add Job"}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title (EN)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="titleAr" render={({ field }) => (<FormItem><FormLabel>Title (AR)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="department" render={({ field }) => (<FormItem><FormLabel>Department (EN)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="departmentAr" render={({ field }) => (<FormItem><FormLabel>Department (AR)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Type</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description (EN)</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="descriptionAr" render={({ field }) => (<FormItem><FormLabel>Description (AR)</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="requirements" render={({ field }) => (<FormItem><FormLabel>Requirements (EN)</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="requirementsAr" render={({ field }) => (<FormItem><FormLabel>Requirements (AR)</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl></FormItem>)} />
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