import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Mail, User, Check, X, RefreshCw } from "lucide-react";
const getApiBaseUrl = () => import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

const NAWA_EMAIL_ACCOUNTS = [
  "ceo@nawainv.sa",
  "cob@nawainv.sa",
  "finance@nawainv.sa",
  "investment@nawainv.sa",
  "marketing@nawainv.sa",
  "support@nawainv.sa",
  "Info@nawainv.sa",
];

interface Employee {
  id: number;
  name: string;
  nameAr: string | null;
  role: string;
  department: string | null;
  active: boolean;
  emailAccount: string | null;
}

interface AccountInfo {
  email: string;
  assignedTo: Employee | null;
  isAvailable: boolean;
}

async function fetchEmailAccounts() {
  const token = localStorage.getItem("nawa_token");
  const res = await fetch(`${getApiBaseUrl()}/api/email-accounts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json() as Promise<{ accounts: AccountInfo[]; employees: Employee[] }>;
}

async function assignAccount(employeeId: number, emailAccount: string | null) {
  const token = localStorage.getItem("nawa_token");
  const res = await fetch(`${getApiBaseUrl()}/api/email-accounts/assign`, {
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
    mutationFn: ({ employeeId, emailAccount }: { employeeId: number; emailAccount: string | null }) =>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isRtl ? "إدارة حسابات البريد الإلكتروني" : "Email Account Management"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isRtl ? "تعيين حسابات بريد نوى للموظفين" : "Assign Nawa email accounts to employees"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          {isRtl ? "تحديث" : "Refresh"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
              <p className="text-2xl font-bold">{accounts.filter(a => !a.isAvailable).length}</p>
              <p className="text-xs text-muted-foreground">{isRtl ? "معينة" : "Assigned"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <X className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{accounts.filter(a => a.isAvailable).length}</p>
              <p className="text-xs text-muted-foreground">{isRtl ? "متاحة" : "Available"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Accounts Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {NAWA_EMAIL_ACCOUNTS.map((email, i) => {
          const info = accounts.find(a => a.email === email);
          const assignedEmployee = info?.assignedTo;
          const isAssigned = !!assignedEmployee;

          return (
            <motion.div
              key={email}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={`transition-all duration-200 hover:shadow-md ${isAssigned ? "border-green-200 bg-green-50/30" : "border-border"}`}>
                <CardHeader className="pb-3 pt-4 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isAssigned ? "bg-green-100" : "bg-muted"}`}>
                        <Mail className={`w-4 h-4 ${isAssigned ? "text-green-600" : "text-muted-foreground"}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate" dir="ltr">{email}</p>
                        <Badge variant={isAssigned ? "default" : "secondary"} className={`text-[10px] mt-0.5 ${isAssigned ? "bg-green-600 hover:bg-green-700" : ""}`}>
                          {isAssigned ? (isRtl ? "معين" : "Assigned") : (isRtl ? "متاح" : "Available")}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  {assignedEmployee && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-green-100">
                      <div className="w-7 h-7 rounded-full bg-[#0D1B3E] flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {assignedEmployee.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {isRtl ? assignedEmployee.nameAr || assignedEmployee.name : assignedEmployee.name}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize truncate">
                          {assignedEmployee.role?.replace("_", " ")}
                          {assignedEmployee.department ? ` · ${assignedEmployee.department}` : ""}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      {isRtl ? "تعيين لموظف:" : "Assign to employee:"}
                    </p>
                    <div className="flex gap-2">
                      <Select
                        value={assignedEmployee?.id?.toString() || "none"}
                        onValueChange={(val) => {
                          const empId = val === "none" ? null : parseInt(val);
                          if (empId === null && assignedEmployee) {
                            mutation.mutate({ employeeId: assignedEmployee.id, emailAccount: null });
                          } else if (empId !== null) {
                            mutation.mutate({ employeeId: empId, emailAccount: email });
                          }
                        }}
                      >
                        <SelectTrigger className="flex-1 h-8 text-sm">
                          <SelectValue placeholder={isRtl ? "اختر موظفاً" : "Select employee"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            <span className="text-muted-foreground">{isRtl ? "— بلا تعيين —" : "— Unassigned —"}</span>
                          </SelectItem>
                          {employees
                            .filter(e => e.active && (!e.emailAccount || e.emailAccount === email))
                            .map(e => (
                              <SelectItem key={e.id} value={e.id.toString()}>
                                {isRtl ? e.nameAr || e.name : e.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
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
                <div>
                  {emp.emailAccount ? (
                    <Badge variant="outline" className="font-mono text-xs border-green-300 text-green-700 bg-green-50" dir="ltr">
                      {emp.emailAccount}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      {isRtl ? "لا يوجد بريد مُعيَّن" : "No email assigned"}
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
