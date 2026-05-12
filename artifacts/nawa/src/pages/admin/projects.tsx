import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useListProjects, useCreateProject, useUpdateProject, useDeleteProject } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";

export default function AdminProjects() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    document.title = language === "ar" ? "إدارة المشاريع | منصة نوى العقارية" : "Manage Projects | Nawa Real Estate Platform";
  }, [language]);

  const { data: projects, isLoading } = useListProjects();

  const form = useForm({
    defaultValues: {
      title: "", titleAr: "", description: "", descriptionAr: "",
      location: "", locationAr: "", status: "planning", type: "",
      totalUnits: 0, availableUnits: 0, completionPercentage: 0,
      imageUrl: "", price: "", area: "", featured: false
    }
  });

  const createMut = useCreateProject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["projects", "admin"] });
        setIsOpen(false);
      }
    }
  });

  const updateMut = useUpdateProject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["projects", "admin"] });
        setIsOpen(false);
      }
    }
  });

  const deleteMut = useDeleteProject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["projects", "admin"] });
      }
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
    form.reset({
      title: "", titleAr: "", description: "", descriptionAr: "",
      location: "", locationAr: "", status: "planning", type: "",
      totalUnits: 0, availableUnits: 0, completionPercentage: 0,
      imageUrl: "", price: "", area: "", featured: false
    });
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{language === "ar" ? "العنوان" : "Title"}</TableHead>
              <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
              <TableHead>{language === "ar" ? "النسبة" : "Completion"}</TableHead>
              <TableHead>{language === "ar" ? "مميز" : "Featured"}</TableHead>
              <TableHead className="text-right">{language === "ar" ? "إجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects?.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{language === "ar" ? project.titleAr : project.title}</TableCell>
                <TableCell>{project.status}</TableCell>
                <TableCell>{project.completionPercentage}%</TableCell>
                <TableCell>{project.featured ? "Yes" : "No"}</TableCell>
                <TableCell className="text-right flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(project)}>
                    <Edit className="w-4 h-4 text-secondary" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate({ id: project.id })}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? (language === "ar" ? "تعديل مشروع" : "Edit Project") : (language === "ar" ? "إضافة مشروع" : "Add Project")}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Title (EN)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="titleAr" render={({ field }) => (
                  <FormItem><FormLabel>العنوان (AR)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="locationAr" render={({ field }) => (
                  <FormItem><FormLabel>الموقع</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem><FormLabel>Type</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="totalUnits" render={({ field }) => (
                  <FormItem><FormLabel>Total Units</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="availableUnits" render={({ field }) => (
                  <FormItem><FormLabel>Available Units</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="completionPercentage" render={({ field }) => (
                  <FormItem><FormLabel>Completion %</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="imageUrl" render={({ field }) => (
                  <FormItem><FormLabel>Image URL</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="featured" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel>Featured on Homepage</FormLabel>
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