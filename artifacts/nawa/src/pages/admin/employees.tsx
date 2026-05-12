import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useListEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";

const roles = ["super_admin", "admin", "manager", "hr", "sales", "broker", "content_manager", "support"];

export default function AdminEmployees() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    document.title = language === "ar" ? "إدارة الموظفين | منصة نوى العقارية" : "Manage Employees | Nawa Real Estate Platform";
  }, [language]);

  const { data: employees } = useListEmployees({
    query: { queryKey: ["employees", "admin"] }
  });

  const form = useForm({
    defaultValues: {
      name: "", nameAr: "", email: "", password: "", role: "support",
      department: "", phone: "", active: true, permissions: "", avatar: ""
    }
  });

  const createMut = useCreateEmployee({
    mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["employees", "admin"] }); setIsOpen(false); } }
  });

  const updateMut = useUpdateEmployee({
    mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["employees", "admin"] }); setIsOpen(false); } }
  });

  const deleteMut = useDeleteEmployee({
    mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["employees", "admin"] }); } }
  });

  const onSubmit = (data: any) => {
    if (editingId) {
      const { password, ...updateData } = data;
      updateMut.mutate({ id: editingId, data: updateData });
    } else {
      createMut.mutate({ data });
    }
  };

  const handleEdit = (employee: any) => {
    form.reset({ ...employee, password: "" });
    setEditingId(employee.id);
    setIsOpen(true);
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-border shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold font-serif text-foreground">
          {language === "ar" ? "إدارة الموظفين" : "Manage Employees"}
        </h1>
        <Button onClick={() => { form.reset(); setEditingId(null); setIsOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          {language === "ar" ? "إضافة موظف" : "Add Employee"}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{language === "ar" ? "الاسم" : "Name"}</TableHead>
              <TableHead>{language === "ar" ? "البريد الإلكتروني" : "Email"}</TableHead>
              <TableHead>{language === "ar" ? "الدور" : "Role"}</TableHead>
              <TableHead>{language === "ar" ? "نشط" : "Active"}</TableHead>
              <TableHead className="text-right">{language === "ar" ? "إجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees?.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell className="font-medium">{language === "ar" ? emp.nameAr || emp.name : emp.name}</TableCell>
                <TableCell>{emp.email}</TableCell>
                <TableCell>{emp.role}</TableCell>
                <TableCell>{emp.active ? "Yes" : "No"}</TableCell>
                <TableCell className="text-right flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(emp)}><Edit className="w-4 h-4 text-secondary" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate({ id: emp.id })}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Employee" : "Add Employee"}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name (EN)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="nameAr" render={({ field }) => (<FormItem><FormLabel>Name (AR)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl></FormItem>)} />
                {!editingId && (
                  <FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl></FormItem>)} />
                )}
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="department" render={({ field }) => (<FormItem><FormLabel>Department</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="avatar" render={({ field }) => (<FormItem><FormLabel>Avatar URL</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="permissions" render={({ field }) => (<FormItem><FormLabel>Permissions</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
              </div>
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