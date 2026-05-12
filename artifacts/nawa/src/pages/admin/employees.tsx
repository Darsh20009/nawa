import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useListEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/shared/image-upload";

const roles = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "hr", label: "HR" },
  { value: "sales", label: "Sales" },
  { value: "broker", label: "Broker" },
  { value: "content_manager", label: "Content Manager" },
  { value: "support", label: "Support" },
];

const roleBadgeColors: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-700",
  admin: "bg-primary/10 text-primary",
  manager: "bg-blue-100 text-blue-700",
  hr: "bg-pink-100 text-pink-700",
  sales: "bg-green-100 text-green-700",
  broker: "bg-secondary/20 text-secondary-foreground",
  content_manager: "bg-orange-100 text-orange-700",
  support: "bg-gray-100 text-gray-700",
};

export default function AdminEmployees() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    document.title = language === "ar" ? "إدارة الموظفين | نوى العقارية" : "Manage Employees | Nawa Real Estate Platform";
  }, [language]);

  const { data: employees, isLoading } = useListEmployees();

  const defaultValues = {
    name: "", nameAr: "", email: "", password: "", role: "support",
    department: "", phone: "", active: true, permissions: "", avatar: ""
  };

  const form = useForm({ defaultValues });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/employees"] });

  const createMut = useCreateEmployee({
    mutation: {
      onSuccess: () => { invalidate(); setIsOpen(false); toast({ title: language === "ar" ? "تمت الإضافة" : "Employee Added" }); },
      onError: (err: any) => toast({ title: language === "ar" ? "خطأ" : "Error", description: err?.message || (language === "ar" ? "فشل في إضافة الموظف" : "Failed to add employee"), variant: "destructive" }),
    }
  });

  const updateMut = useUpdateEmployee({
    mutation: {
      onSuccess: () => { invalidate(); setIsOpen(false); toast({ title: language === "ar" ? "تم التحديث" : "Employee Updated" }); },
      onError: () => toast({ title: language === "ar" ? "خطأ" : "Error", variant: "destructive" }),
    }
  });

  const deleteMut = useDeleteEmployee({
    mutation: {
      onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: language === "ar" ? "تم الحذف" : "Deleted" }); },
      onError: () => toast({ title: language === "ar" ? "خطأ" : "Error", variant: "destructive" }),
    }
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
        <Button onClick={() => { form.reset(defaultValues); setEditingId(null); setIsOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          {language === "ar" ? "إضافة موظف" : "Add Employee"}
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{language === "ar" ? "الاسم" : "Name"}</TableHead>
              <TableHead>{language === "ar" ? "البريد الإلكتروني" : "Email"}</TableHead>
              <TableHead>{language === "ar" ? "الدور" : "Role"}</TableHead>
              <TableHead>{language === "ar" ? "القسم" : "Department"}</TableHead>
              <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
              <TableHead className="text-right">{language === "ar" ? "إجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</TableCell></TableRow>
            ) : employees && employees.length > 0 ? employees.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell className="font-medium">{language === "ar" ? emp.nameAr || emp.name : emp.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{emp.email}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${roleBadgeColors[emp.role] || "bg-gray-100 text-gray-700"}`}>
                    {roles.find(r => r.value === emp.role)?.label || emp.role}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{emp.department || "—"}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${emp.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {emp.active ? (language === "ar" ? "نشط" : "Active") : (language === "ar" ? "غير نشط" : "Inactive")}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(emp)}><Edit className="w-4 h-4 text-secondary" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(emp.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">{language === "ar" ? "لا يوجد موظفون" : "No employees found"}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? (language === "ar" ? "تعديل بيانات موظف" : "Edit Employee") : (language === "ar" ? "إضافة موظف جديد" : "Add New Employee")}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name (EN)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="nameAr" render={({ field }) => (<FormItem><FormLabel>الاسم (AR)</FormLabel><FormControl><Input {...field} dir="rtl" /></FormControl></FormItem>)} />
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                {!editingId && (
                  <FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormLabel>{language === "ar" ? "كلمة المرور" : "Password"}</FormLabel><FormControl><PasswordInput autoComplete="new-password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                )}
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "ar" ? "الدور" : "Role"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder={language === "ar" ? "اختر الدور" : "Select role"} /></SelectTrigger></FormControl>
                      <SelectContent>
                        {roles.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="department" render={({ field }) => (<FormItem><FormLabel>{language === "ar" ? "القسم" : "Department"}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>{language === "ar" ? "الهاتف" : "Phone"}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="avatar" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>{language === "ar" ? "الصورة الشخصية" : "Avatar"}</FormLabel><FormControl><ImageUpload value={field.value} onChange={field.onChange} variant="avatar" /></FormControl></FormItem>)} />
                <FormField control={form.control} name="permissions" render={({ field }) => (<FormItem><FormLabel>{language === "ar" ? "الصلاحيات" : "Permissions"}</FormLabel><FormControl><Input {...field} placeholder={language === "ar" ? "مثال: read,write" : "e.g. read,write"} /></FormControl></FormItem>)} />
              </div>
              <FormField control={form.control} name="active" render={({ field }) => (
                <FormItem className="flex items-center gap-3 space-y-0 border rounded-lg p-3">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="cursor-pointer">{language === "ar" ? "حساب نشط" : "Active Account"}</FormLabel>
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
            <DialogDescription>{language === "ar" ? "هل أنت متأكد من حذف هذا الموظف؟ سيفقد وصوله للنظام." : "Are you sure you want to delete this employee? They will lose all system access."}</DialogDescription>
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
