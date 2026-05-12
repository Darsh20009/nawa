import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useListJobApplications, useUpdateJobApplication, useDeleteJobApplication, useListJobs } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, Mail, Phone, Linkedin, FileDown, Search, GraduationCap, Briefcase, MapPin, DollarSign, Clock, MessageCircle, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const STATUSES = [
  { value: "pending", labelAr: "قيد الانتظار", labelEn: "Pending", color: "bg-gray-100 text-gray-700 border-gray-300" },
  { value: "reviewing", labelAr: "قيد المراجعة", labelEn: "Reviewing", color: "bg-blue-100 text-blue-700 border-blue-300" },
  { value: "shortlisted", labelAr: "قائمة قصيرة", labelEn: "Shortlisted", color: "bg-purple-100 text-purple-700 border-purple-300" },
  { value: "interview", labelAr: "مقابلة", labelEn: "Interview", color: "bg-amber-100 text-amber-700 border-amber-300" },
  { value: "hired", labelAr: "تم التعيين", labelEn: "Hired", color: "bg-green-100 text-green-700 border-green-300" },
  { value: "rejected", labelAr: "مرفوض", labelEn: "Rejected", color: "bg-red-100 text-red-700 border-red-300" },
];

export default function AdminApplications() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [jobFilter, setJobFilter] = useState<string>("all");
  const [viewing, setViewing] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    document.title = language === "ar" ? "طلبات التوظيف | نوى العقارية" : "Job Applications | Nawa Real Estate";
  }, [language]);

  const { data: applications, isLoading } = useListJobApplications();
  const { data: jobs } = useListJobs();

  const jobMap = useMemo(() => {
    const m = new Map<number, any>();
    (jobs || []).forEach(j => m.set(j.id, j));
    return m;
  }, [jobs]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/jobs/applications"] });

  const updateMut = useUpdateJobApplication({
    mutation: {
      onSuccess: () => {
        invalidate();
        toast({ title: language === "ar" ? "تم التحديث" : "Updated" });
      },
      onError: () => toast({ variant: "destructive", title: language === "ar" ? "فشل التحديث" : "Update failed" }),
    },
  });

  const deleteMut = useDeleteJobApplication({
    mutation: {
      onSuccess: () => {
        invalidate();
        setDeleteId(null);
        toast({ title: language === "ar" ? "تم الحذف" : "Deleted" });
      },
      onError: () => toast({ variant: "destructive", title: language === "ar" ? "فشل الحذف" : "Delete failed" }),
    },
  });

  const filtered = useMemo(() => {
    if (!applications) return [];
    const q = search.trim().toLowerCase();
    return applications.filter(a => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (jobFilter !== "all" && String(a.jobId) !== jobFilter) return false;
      if (q) {
        const hay = `${a.applicantName} ${a.email} ${a.phone || ""} ${a.currentPosition || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [applications, search, statusFilter, jobFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: applications?.length || 0 };
    STATUSES.forEach(s => c[s.value] = 0);
    (applications || []).forEach(a => { c[a.status] = (c[a.status] || 0) + 1; });
    return c;
  }, [applications]);

  const statusBadge = (s: string) => {
    const def = STATUSES.find(x => x.value === s);
    return <Badge variant="outline" className={`${def?.color || ""}`}>{language === "ar" ? def?.labelAr : def?.labelEn || s}</Badge>;
  };

  const openView = (app: any) => {
    setViewing(app);
    setAdminNotes(app.adminNotes || "");
  };

  const saveNotes = () => {
    if (viewing) updateMut.mutate({ id: viewing.id, data: { adminNotes } });
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-border shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold font-serif text-foreground">{language === "ar" ? "طلبات التوظيف" : "Job Applications"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{language === "ar" ? `${counts.all} طلب إجمالاً` : `${counts.all} total applications`}</p>
        </div>
      </div>

      {/* Status quick filters */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setStatusFilter("all")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${statusFilter === "all" ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border hover:border-primary/30"}`}>
          {language === "ar" ? "الكل" : "All"} <span className="opacity-70">({counts.all})</span>
        </button>
        {STATUSES.map(s => (
          <button key={s.value} onClick={() => setStatusFilter(s.value)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${statusFilter === s.value ? `${s.color} ring-2 ring-offset-1` : "bg-white text-muted-foreground border-border hover:border-primary/30"}`}>
            {language === "ar" ? s.labelAr : s.labelEn} <span className="opacity-70">({counts[s.value]})</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 rtl:pl-3 rtl:pr-9" placeholder={language === "ar" ? "بحث بالاسم، البريد، الجوال..." : "Search by name, email, phone..."} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={jobFilter} onValueChange={setJobFilter}>
          <SelectTrigger className="md:w-[220px]"><SelectValue placeholder={language === "ar" ? "كل الوظائف" : "All jobs"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === "ar" ? "كل الوظائف" : "All jobs"}</SelectItem>
            {(jobs || []).map(j => <SelectItem key={j.id} value={String(j.id)}>{language === "ar" ? j.titleAr : j.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{language === "ar" ? "المتقدم" : "Applicant"}</TableHead>
              <TableHead>{language === "ar" ? "الوظيفة" : "Job"}</TableHead>
              <TableHead>{language === "ar" ? "التواصل" : "Contact"}</TableHead>
              <TableHead>{language === "ar" ? "الخبرة" : "Exp."}</TableHead>
              <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
              <TableHead>{language === "ar" ? "التاريخ" : "Date"}</TableHead>
              <TableHead className="text-right">{language === "ar" ? "إجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</TableCell></TableRow>
            ) : filtered.length > 0 ? filtered.map(app => {
              const job = jobMap.get(app.jobId);
              return (
                <TableRow key={app.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="font-medium">{app.applicantName}</div>
                    {app.currentPosition && <div className="text-xs text-muted-foreground">{app.currentPosition}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{job ? (language === "ar" ? job.titleAr : job.title) : `#${app.jobId}`}</div>
                    {job?.department && <div className="text-xs text-muted-foreground">{language === "ar" ? job.departmentAr : job.department}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs"><a href={`mailto:${app.email}`} className="text-primary hover:underline" dir="ltr">{app.email}</a></div>
                    {app.phone && <div className="text-xs text-muted-foreground" dir="ltr">{app.phone}</div>}
                  </TableCell>
                  <TableCell>
                    {app.yearsExperience != null ? <span className="text-sm">{app.yearsExperience} {language === "ar" ? "سنة" : "yrs"}</span> : <span className="text-muted-foreground text-xs">—</span>}
                  </TableCell>
                  <TableCell>
                    <Select value={app.status} onValueChange={(v) => updateMut.mutate({ id: app.id, data: { status: v as any } })}>
                      <SelectTrigger className="h-8 text-xs w-[140px] border-0 bg-transparent p-0 [&>svg]:hidden">
                        <div className="w-full">{statusBadge(app.status)}</div>
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{language === "ar" ? s.labelAr : s.labelEn}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(app.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openView(app)}><Eye className="w-4 h-4 text-primary" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(app.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            }) : (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">{language === "ar" ? "لا توجد طلبات تطابق البحث" : "No applications match the filters"}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Dialog */}
      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{viewing.applicantName}</DialogTitle>
                <DialogDescription className="flex items-center gap-3 mt-1">
                  <span>{jobMap.get(viewing.jobId) ? (language === "ar" ? jobMap.get(viewing.jobId).titleAr : jobMap.get(viewing.jobId).title) : `Job #${viewing.jobId}`}</span>
                  <span>•</span>
                  <span>{formatDate(viewing.createdAt)}</span>
                  {statusBadge(viewing.status)}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoRow icon={Mail} label={language === "ar" ? "البريد" : "Email"} value={viewing.email} link={`mailto:${viewing.email}`} />
                {viewing.phone && <InfoRow icon={Phone} label={language === "ar" ? "الجوال" : "Phone"} value={viewing.phone} link={`tel:${viewing.phone}`} />}
                {viewing.nationality && <InfoRow icon={MapPin} label={language === "ar" ? "الجنسية" : "Nationality"} value={viewing.nationality} />}
                {viewing.city && <InfoRow icon={MapPin} label={language === "ar" ? "المدينة" : "City"} value={viewing.city} />}
                {viewing.currentPosition && <InfoRow icon={Briefcase} label={language === "ar" ? "المسمى الوظيفي" : "Current Position"} value={viewing.currentPosition} />}
                {viewing.yearsExperience != null && <InfoRow icon={Briefcase} label={language === "ar" ? "الخبرة" : "Experience"} value={`${viewing.yearsExperience} ${language === "ar" ? "سنة" : "yrs"}`} />}
                {viewing.education && <InfoRow icon={GraduationCap} label={language === "ar" ? "المؤهل" : "Education"} value={viewing.education} fullWidth />}
                {viewing.expectedSalary && <InfoRow icon={DollarSign} label={language === "ar" ? "الراتب المتوقع" : "Expected Salary"} value={viewing.expectedSalary} />}
                {viewing.noticePeriod && <InfoRow icon={Clock} label={language === "ar" ? "فترة الإشعار" : "Notice Period"} value={viewing.noticePeriod} />}
                {viewing.howDidYouHear && <InfoRow icon={Sparkles} label={language === "ar" ? "كيف عرف عنا" : "Heard About Us"} value={viewing.howDidYouHear} />}
                {viewing.linkedinUrl && <InfoRow icon={Linkedin} label="LinkedIn" value={viewing.linkedinUrl} link={viewing.linkedinUrl} />}
                {viewing.portfolioUrl && <InfoRow icon={Sparkles} label={language === "ar" ? "الأعمال" : "Portfolio"} value={viewing.portfolioUrl} link={viewing.portfolioUrl} />}
              </div>

              {viewing.whyJoinUs && (
                <div className="border-t pt-3">
                  <h4 className="text-sm font-semibold mb-1 flex items-center gap-2"><Sparkles className="w-4 h-4 text-secondary" /> {language === "ar" ? "لماذا نوى؟" : "Why Nawa?"}</h4>
                  <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3 whitespace-pre-line">{viewing.whyJoinUs}</p>
                </div>
              )}

              {viewing.coverLetter && (
                <div className="border-t pt-3">
                  <h4 className="text-sm font-semibold mb-1 flex items-center gap-2"><MessageCircle className="w-4 h-4 text-secondary" /> {language === "ar" ? "رسالة التغطية" : "Cover Letter"}</h4>
                  <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3 whitespace-pre-line">{viewing.coverLetter}</p>
                </div>
              )}

              {safeHref(viewing.resumeUrl ?? undefined) && (
                <div className="border-t pt-3">
                  <a href={safeHref(viewing.resumeUrl ?? undefined)} target="_blank" rel="noopener noreferrer" download className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
                    <FileDown className="w-4 h-4" />{language === "ar" ? "تحميل السيرة الذاتية" : "Download Resume"}
                  </a>
                </div>
              )}

              <div className="border-t pt-3">
                <h4 className="text-sm font-semibold mb-2">{language === "ar" ? "ملاحظات الإدارة" : "Admin Notes"}</h4>
                <Textarea rows={3} value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder={language === "ar" ? "ملاحظات داخلية حول المتقدم..." : "Internal notes about the applicant..."} />
                <Button onClick={saveNotes} size="sm" className="mt-2" disabled={updateMut.isPending}>{language === "ar" ? "حفظ الملاحظات" : "Save Notes"}</Button>
              </div>

              <DialogFooter className="border-t pt-3">
                <div className="flex items-center gap-2 w-full">
                  <span className="text-sm font-medium">{language === "ar" ? "الحالة:" : "Status:"}</span>
                  <Select value={viewing.status} onValueChange={(v) => { updateMut.mutate({ id: viewing.id, data: { status: v as any } }); setViewing({ ...viewing, status: v }); }}>
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{language === "ar" ? s.labelAr : s.labelEn}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "تأكيد الحذف" : "Confirm Delete"}</DialogTitle>
            <DialogDescription>{language === "ar" ? "هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع." : "Are you sure you want to delete this application? This cannot be undone."}</DialogDescription>
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

function safeHref(url?: string): string | undefined {
  if (!url) return undefined;
  const v = url.trim();
  if (v.startsWith("/api/storage/") || v.startsWith("/")) return v;
  try {
    const u = new URL(v);
    if (u.protocol === "http:" || u.protocol === "https:" || u.protocol === "mailto:") return u.toString();
  } catch { /* noop */ }
  return undefined;
}

function InfoRow({ icon: Icon, label, value, link, fullWidth }: { icon: any; label: string; value: string; link?: string; fullWidth?: boolean }) {
  const safe = safeHref(link);
  const content = safe ? <a href={safe} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all" dir="ltr">{value}</a> : <span className="break-all">{value}</span>;
  return (
    <div className={`bg-muted/20 rounded-lg p-3 ${fullWidth ? "col-span-2" : ""}`}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5"><Icon className="w-3 h-3" />{label}</div>
      <div className="text-sm font-medium">{content}</div>
    </div>
  );
}
