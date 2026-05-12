import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Mail, User, Check, Users, RefreshCw, X } from "lucide-react";

const NAWA_EMAIL_ACCOUNTS = [
  "ceo@nawainv.sa",
  "cob@nawainv.sa",
  "finance@nawainv.sa",
  "investment@nawainv.sa",
  "marketing@nawainv.sa",
  "support@nawainv.sa",
  "info@nawainv.sa",
];

interface Employee {
  id: string;
  name: string;
  nameAr: string | null;
  role: string;
  department: string | null;
  active: boolean;
  emailAccount: string | null;
}

interface AccountInfo {
  email: string;
  assignedEmployees: Employee[];
}

async function fetchEmailAccounts() {
  const token = localStorage.getItem("nawa_token");
  const res = await fetch(`/api/email-accounts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json() as Promise<{ accounts: AccountInfo[]; employees: Employee[] }>;
}

async function assignAccount(employeeId: string, emailAccount: string | null) {
  const token = localStorage.getItem("nawa_token");
  const res = await fetch(`/api/email-accounts/assign`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ employeeId, emailAccount }),
  });
  if (!res.ok) throw new Error("Failed to assign");
  return res.json();
}

export default function AdminEmailAccounts() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isRtl = language === "ar";

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["email-accounts"],
    queryFn: fetchEmailAccounts,
  });

  const mutation = useMutation({
    mutationFn: ({ employeeId, emailAccount }: { employeeId: string; emailAccount: string | null }) =>
      assignAccount(employeeId, emailAccount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-accounts"] });
      toast({ title: isRtl ? "تم التحديث" : "Updated", description: isRtl ? "تم تعيين حساب البريد بنجاح" : "Email account assigned successfully" });
    },
    onError: () => {
      toast({ title: isRtl ? "خطأ" : "Error", variant: "destructive", description: isRtl ? "فشل التحديث" : "Update failed" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { accounts = [], employees = [] } = data || {};
  const totalAssigned = employees.filter(e => e.emailAccount).length;
  const totalWithAccount = accounts.filter(a => a.assignedEmployees.length > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isRtl ? "إدارة حسابات البريد الإلكتروني" : "Email Account Management"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isRtl ? "تعيين حسابات بريد نوى للموظفين — يمكن تعيين نفس الحساب لأكثر من موظف" : "Assign Nawa email accounts to employees — multiple employees can share the same account"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          {isRtl ? "تحديث" : "Refresh"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{NAWA_EMAIL_ACCOUNTS.length}</p>
              <p className="text-xs text-muted-foreground">{isRtl ? "إجمالي الحسابات" : "Total Accounts"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalWithAccount}</p>
              <p className="text-xs text-muted-foreground">{isRtl ? "حسابات مُستخدمة" : "Accounts in use"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalAssigned}</p>
              <p className="text-xs text-muted-foreground">{isRtl ? "موظفون لديهم بريد" : "Employees with email"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Accounts Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {NAWA_EMAIL_ACCOUNTS.map((email, i) => {
          const info = accounts.find(a => a.email === email);
          const assignedEmployees = info?.assignedEmployees || [];

          return (
            <motion.div
              key={email}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={`transition-all duration-200 hover:shadow-md ${assignedEmployees.length > 0 ? "border-green-200" : "border-border"}`}>
                <CardHeader className="pb-3 pt-4 px-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${assignedEmployees.length > 0 ? "bg-green-100" : "bg-muted"}`}>
                      <Mail className={`w-4 h-4 ${assignedEmployees.length > 0 ? "text-green-600" : "text-muted-foreground"}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate" dir="ltr">{email}</p>
                      <Badge variant={assignedEmployees.length > 0 ? "default" : "secondary"} className={`text-[10px] mt-0.5 ${assignedEmployees.length > 0 ? "bg-green-600 hover:bg-green-700" : ""}`}>
                        {assignedEmployees.length > 0
                          ? `${assignedEmployees.length} ${isRtl ? "موظف" : "employee(s)"}`
                          : (isRtl ? "غير مُعيَّن" : "Unassigned")}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  {/* Current assignees */}
                  {assignedEmployees.length > 0 && (
                    <div className="space-y-1.5">
                      {assignedEmployees.map(emp => (
                        <div key={emp.id} className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-100">
                          <div className="w-6 h-6 rounded-full bg-[#0D1B3E] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                            {emp.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate">
                              {isRtl ? emp.nameAr || emp.name : emp.name}
                            </p>
                          </div>
                          <button
                            onClick={() => mutation.mutate({ employeeId: emp.id, emailAccount: null })}
                            className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add employee */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      {isRtl ? "إضافة موظف:" : "Add employee:"}
                    </p>
                    <Select
                      value=""
                      onValueChange={(val) => {
                        if (val) mutation.mutate({ employeeId: val, emailAccount: email });
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder={isRtl ? "اختر موظفاً للإضافة..." : "Add employee..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {employees
                          .filter(e => e.active && e.emailAccount !== email)
                          .map(e => (
                            <SelectItem key={e.id} value={e.id.toString()}>
                              <span>{isRtl ? e.nameAr || e.name : e.name}</span>
                              {e.emailAccount && (
                                <span className="text-muted-foreground text-[10px] ms-1">({e.emailAccount})</span>
                              )}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Employee Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" />
            {isRtl ? "حالة الموظفين" : "Employee Status"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {employees.filter(e => e.active).map(emp => (
              <div key={emp.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#0D1B3E] flex items-center justify-center text-white text-xs font-bold">
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{isRtl ? emp.nameAr || emp.name : emp.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{emp.role?.replace("_", " ")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {emp.emailAccount ? (
                    <>
                      <Badge variant="outline" className="font-mono text-xs border-green-300 text-green-700 bg-green-50" dir="ltr">
                        {emp.emailAccount}
                      </Badge>
                      <button
                        onClick={() => mutation.mutate({ employeeId: emp.id, emailAccount: null })}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      {isRtl ? "لا يوجد بريد" : "No email"}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
