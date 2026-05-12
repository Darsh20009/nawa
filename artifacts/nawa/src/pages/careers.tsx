import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import { useListJobs, useApplyForJob } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Clock, ChevronLeft, ChevronRight, Check, User, FileText, Sparkles, Upload as UploadIcon, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/shared/page-header";
import { useRef } from "react";

const applySchema = z.object({
  applicantName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  nationality: z.string().optional(),
  city: z.string().optional(),
  currentPosition: z.string().optional(),
  yearsExperience: z.coerce.number().int().min(0).max(60).optional(),
  education: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  expectedSalary: z.string().optional(),
  noticePeriod: z.string().optional(),
  whyJoinUs: z.string().min(20),
  howDidYouHear: z.string().optional(),
  coverLetter: z.string().optional(),
  resumeUrl: z.string().optional(),
});
type ApplyFormValues = z.infer<typeof applySchema>;

type StepDef = { id: number; titleAr: string; titleEn: string; icon: any; fields: (keyof ApplyFormValues)[] };

const STEPS: StepDef[] = [
  { id: 1, titleAr: "البيانات الشخصية", titleEn: "Personal Info", icon: User, fields: ["applicantName", "email", "phone", "nationality", "city"] },
  { id: 2, titleAr: "الخبرة والمؤهلات", titleEn: "Experience", icon: FileText, fields: ["currentPosition", "yearsExperience", "education", "linkedinUrl", "portfolioUrl"] },
  { id: 3, titleAr: "السيرة الذاتية", titleEn: "Resume", icon: UploadIcon, fields: ["resumeUrl"] },
  { id: 4, titleAr: "لماذا نوى؟", titleEn: "Why Nawa?", icon: Sparkles, fields: ["whyJoinUs", "expectedSalary", "noticePeriod", "howDidYouHear", "coverLetter"] },
];

export default function Careers() {
  const { language } = useLanguage();
  const t = translations[language];
  const { toast } = useToast();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeProgress, setResumeProgress] = useState(0);
  const [resumeFileName, setResumeFileName] = useState<string>("");
  const resumeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = `${t.careers} | نوى العقارية`;
  }, [t.careers]);

  const { data: jobs, isLoading } = useListJobs();

  const form = useForm<ApplyFormValues>({
    resolver: zodResolver(applySchema),
    mode: "onTouched",
    defaultValues: {
      applicantName: "", email: "", phone: "", nationality: "", city: "",
      currentPosition: "", yearsExperience: undefined, education: "",
      linkedinUrl: "", portfolioUrl: "", expectedSalary: "", noticePeriod: "",
      whyJoinUs: "", howDidYouHear: "", coverLetter: "", resumeUrl: "",
    },
  });

  const applyMutation = useApplyForJob({
    mutation: {
      onSuccess: () => {
        toast({
          title: language === "ar" ? "تم تقديم طلبك بنجاح ✨" : "Application submitted ✨",
          description: language === "ar" ? "سيراجع فريق التوظيف ملفك ويتواصل معك قريباً" : "Our HR team will review your file and contact you soon",
        });
        setSelectedJobId(null);
        setStep(1);
        form.reset();
        setResumeFileName("");
      },
      onError: () => toast({ variant: "destructive", title: language === "ar" ? "حدث خطأ" : "Error", description: language === "ar" ? "فشل التقديم. حاول مرة أخرى." : "Failed to submit. Please try again." }),
    }
  });

  const uploadResume = async (file: File) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type) && !/\.(pdf|doc|docx|jpg|jpeg|png)$/i.test(file.name)) {
      toast({ variant: "destructive", title: language === "ar" ? "نوع غير مدعوم" : "Unsupported", description: language === "ar" ? "PDF أو DOC فقط" : "Only PDF or DOC files." });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: language === "ar" ? "الحجم كبير" : "Too large", description: language === "ar" ? "الحد الأقصى 10 ميجا" : "Max 10MB." });
      return;
    }
    setResumeUploading(true); setResumeProgress(0);
    try {
      const metaRes = await fetch("/api/storage/uploads/request-url", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type || "application/pdf" }),
      });
      const { uploadURL, objectPath } = await metaRes.json();
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadURL);
        xhr.setRequestHeader("Content-Type", file.type || "application/pdf");
        xhr.upload.onprogress = (e) => e.lengthComputable && setResumeProgress(Math.round((e.loaded / e.total) * 100));
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("upload failed"));
        xhr.onerror = () => reject(new Error("network"));
        xhr.send(file);
      });
      form.setValue("resumeUrl", `/api/storage${objectPath}`, { shouldValidate: true });
      setResumeFileName(file.name);
      toast({ title: language === "ar" ? "تم رفع السيرة" : "Resume uploaded" });
    } catch {
      toast({ variant: "destructive", title: language === "ar" ? "فشل الرفع" : "Upload failed" });
    } finally {
      setResumeUploading(false); setResumeProgress(0);
    }
  };

  const onSubmit = (data: ApplyFormValues) => {
    if (selectedJobId) {
      applyMutation.mutate({
        id: selectedJobId,
        data: {
          ...data,
          yearsExperience: data.yearsExperience != null ? Number(data.yearsExperience) : undefined,
        } as any
      });
    }
  };

  const goNext = async () => {
    const fields = STEPS[step - 1].fields;
    const valid = await form.trigger(fields as any);
    if (valid) setStep((s) => Math.min(STEPS.length, s + 1));
  };

  const goPrev = () => setStep((s) => Math.max(1, s - 1));

  const openApply = (jobId: string) => { setSelectedJobId(jobId); setStep(1); };

  const closeApply = (open: boolean) => {
    if (!open) { setSelectedJobId(null); setStep(1); form.reset(); setResumeFileName(""); }
  };

  const activeJobs = jobs?.filter(j => j.active) || [];
  const selectedJob = jobs?.find(j => j.id === selectedJobId);
  const progressPct = (step / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-muted/10">
      <PageHeader
        eyebrow={language === "ar" ? "انضم إلينا" : "Join Us"}
        title={language === "ar" ? "الوظائف" : "Careers"}
        subtitle={language === "ar" ? "كن جزءاً من فريقنا المتميز وابنِ مسيرتك المهنية في عالم الاستثمار العقاري" : "Be part of our distinguished team and build your career in real estate investment"}
      />
      <div className="container mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold font-serif mb-6 text-primary">{t.careers}</h1>
          <p className="text-lg text-muted-foreground">
            {language === "ar"
              ? "انضم إلى فريق من المحترفين الشغوفين ببناء مستقبل العقار. نبحث دائماً عن المواهب الاستثنائية التي تشاركنا رؤيتنا وقيمنا."
              : "Join a team of professionals passionate about building the future of real estate. We are always looking for exceptional talent who share our vision and values."}
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-border shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div><Skeleton className="h-6 w-64 mb-2" /><Skeleton className="h-4 w-32" /></div>
                  <Skeleton className="h-10 w-28 rounded-md" />
                </div>
                <Skeleton className="h-16 w-full" />
              </div>
            ))
          ) : activeJobs.length > 0 ? (
            activeJobs.map((job, index) => (
              <motion.div key={job.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 md:p-8 border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                  <div>
                    <h3 className="text-2xl font-bold font-serif text-foreground mb-2">{language === "ar" ? job.titleAr : job.title}</h3>
                    <p className="text-primary font-medium">{language === "ar" ? job.departmentAr : job.department}</p>
                  </div>
                  <Button onClick={() => openApply(job.id)} className="shrink-0 md:w-auto w-full gap-2">
                    {t.applyNow} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                  {job.location && <div className="flex items-center gap-1"><MapPin className="w-4 h-4 text-secondary" /><span>{job.location}</span></div>}
                  {job.type && <div className="flex items-center gap-1"><Briefcase className="w-4 h-4 text-secondary" /><span className="capitalize">{job.type.replace("-", " ")}</span></div>}
                  <div className="flex items-center gap-1"><Clock className="w-4 h-4 text-secondary" /><span>{language === "ar" ? "دوام كامل" : "Full Time"}</span></div>
                </div>
                <div className="prose dark:prose-invert max-w-none text-muted-foreground text-sm">
                  <p className="mb-4">{language === "ar" ? job.descriptionAr : job.description}</p>
                  {job.requirements && (
                    <div>
                      <h4 className="text-foreground font-semibold mb-2">{language === "ar" ? "المتطلبات:" : "Requirements:"}</h4>
                      <p className="whitespace-pre-line">{language === "ar" ? job.requirementsAr : job.requirements}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-xl border border-border">
              <p className="text-xl text-muted-foreground">{language === "ar" ? "لا توجد وظائف شاغرة حالياً" : "No open positions currently"}</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={selectedJobId !== null} onOpenChange={closeApply}>
        <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {t.applyNow}
              {selectedJob && <span className="block text-sm font-normal text-muted-foreground mt-1">{language === "ar" ? selectedJob.titleAr : selectedJob.title}</span>}
            </DialogTitle>
            <DialogDescription>{language === "ar" ? "املأ النموذج التالي بعناية. كل الحقول مهمة لتقييم طلبك." : "Please fill out this form carefully. Every field matters to evaluate your application."}</DialogDescription>
          </DialogHeader>

          {/* Stepper */}
          <div className="px-1 pt-2">
            <div className="flex items-center justify-between mb-3">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const done = step > s.id;
                const active = step === s.id;
                return (
                  <div key={s.id} className="flex-1 flex items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${done ? "bg-secondary text-white" : active ? "bg-primary text-white ring-4 ring-primary/20" : "bg-muted text-muted-foreground"}`}>
                      {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${step > s.id ? "bg-secondary" : "bg-muted"}`} />}
                  </div>
                );
              })}
            </div>
            <div className="text-center mb-1">
              <p className="text-xs text-muted-foreground">{language === "ar" ? `الخطوة ${step} من ${STEPS.length}` : `Step ${step} of ${STEPS.length}`}</p>
              <p className="text-sm font-semibold text-primary">{language === "ar" ? STEPS[step - 1].titleAr : STEPS[step - 1].titleEn}</p>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-secondary transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-3">
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-4">
                  {step === 1 && (
                    <>
                      <FormField control={form.control} name="applicantName" render={({ field }) => (
                        <FormItem><FormLabel>{language === "ar" ? "الاسم الكامل *" : "Full Name *"}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="email" render={({ field }) => (
                          <FormItem><FormLabel>{language === "ar" ? "البريد الإلكتروني *" : "Email *"}</FormLabel><FormControl><Input type="email" dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="phone" render={({ field }) => (
                          <FormItem><FormLabel>{language === "ar" ? "رقم الجوال *" : "Phone *"}</FormLabel><FormControl><Input type="tel" dir="ltr" placeholder="+9665XXXXXXXX" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="nationality" render={({ field }) => (
                          <FormItem><FormLabel>{language === "ar" ? "الجنسية" : "Nationality"}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="city" render={({ field }) => (
                          <FormItem><FormLabel>{language === "ar" ? "مدينة الإقامة" : "City of Residence"}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                        )} />
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="currentPosition" render={({ field }) => (
                          <FormItem><FormLabel>{language === "ar" ? "المسمى الوظيفي الحالي" : "Current Position"}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="yearsExperience" render={({ field }) => (
                          <FormItem><FormLabel>{language === "ar" ? "سنوات الخبرة" : "Years of Experience"}</FormLabel><FormControl><Input type="number" min={0} max={60} {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="education" render={({ field }) => (
                        <FormItem><FormLabel>{language === "ar" ? "المؤهل العلمي" : "Education"}</FormLabel><FormControl><Input placeholder={language === "ar" ? "مثال: بكالوريوس إدارة أعمال - جامعة الملك سعود" : "e.g. BSc Business Administration - KSU"} {...field} /></FormControl></FormItem>
                      )} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="linkedinUrl" render={({ field }) => (
                          <FormItem><FormLabel>LinkedIn</FormLabel><FormControl><Input type="url" dir="ltr" placeholder="https://linkedin.com/in/..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="portfolioUrl" render={({ field }) => (
                          <FormItem><FormLabel>{language === "ar" ? "موقع/معرض الأعمال" : "Portfolio URL"}</FormLabel><FormControl><Input type="url" dir="ltr" placeholder="https://" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <div>
                      <FormLabel className="block mb-2">{language === "ar" ? "السيرة الذاتية (PDF / DOC حتى 10MB)" : "Resume (PDF / DOC up to 10MB)"}</FormLabel>
                      <div onClick={() => !resumeUploading && resumeInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${resumeUploading ? "pointer-events-none border-secondary bg-secondary/5" : form.watch("resumeUrl") ? "border-secondary/50 bg-secondary/5" : "border-border hover:border-secondary/50 hover:bg-muted/30"}`}>
                        {resumeUploading ? (
                          <>
                            <UploadIcon className="w-10 h-10 text-secondary mx-auto mb-3 animate-pulse" />
                            <p className="font-medium">{language === "ar" ? `جاري الرفع ${resumeProgress}%` : `Uploading ${resumeProgress}%`}</p>
                            <div className="w-3/4 h-1 bg-muted rounded-full mt-3 mx-auto overflow-hidden"><div className="h-full bg-secondary transition-all" style={{ width: `${resumeProgress}%` }} /></div>
                          </>
                        ) : form.watch("resumeUrl") ? (
                          <>
                            <Check className="w-10 h-10 text-green-600 mx-auto mb-2" />
                            <p className="font-medium text-foreground">{resumeFileName || (language === "ar" ? "تم رفع السيرة الذاتية" : "Resume uploaded")}</p>
                            <p className="text-xs text-muted-foreground mt-1">{language === "ar" ? "اضغط لتغيير الملف" : "Click to change file"}</p>
                          </>
                        ) : (
                          <>
                            <UploadIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                            <p className="font-medium text-foreground">{language === "ar" ? "اضغط لرفع السيرة الذاتية" : "Click to upload your resume"}</p>
                            <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX</p>
                          </>
                        )}
                      </div>
                      <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={(e) => e.target.files?.[0] && uploadResume(e.target.files[0])} />
                      <p className="text-xs text-muted-foreground text-center mt-3">{language === "ar" ? "الرفع اختياري — يمكنك إكمال الطلب بدون سيرة ذاتية" : "Upload is optional — you can submit without a resume"}</p>
                    </div>
                  )}

                  {step === 4 && (
                    <>
                      <FormField control={form.control} name="whyJoinUs" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === "ar" ? "لماذا تريد الانضمام إلى نوى العقارية؟ * (20 حرف على الأقل)" : "Why do you want to join Nawa? * (min 20 chars)"}</FormLabel>
                          <FormControl><Textarea rows={4} {...field} placeholder={language === "ar" ? "أخبرنا عن دوافعك وما الذي يميزك..." : "Tell us about your motivation and what makes you stand out..."} /></FormControl><FormMessage />
                        </FormItem>
                      )} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="expectedSalary" render={({ field }) => (
                          <FormItem><FormLabel>{language === "ar" ? "الراتب المتوقع (شهري)" : "Expected Salary (monthly)"}</FormLabel><FormControl><Input placeholder={language === "ar" ? "مثال: 15000 ريال" : "e.g. 15,000 SAR"} {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="noticePeriod" render={({ field }) => (
                          <FormItem><FormLabel>{language === "ar" ? "فترة الإشعار" : "Notice Period"}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder={language === "ar" ? "اختر..." : "Select..."} /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="immediate">{language === "ar" ? "فوراً" : "Immediate"}</SelectItem>
                                <SelectItem value="2-weeks">{language === "ar" ? "أسبوعان" : "2 Weeks"}</SelectItem>
                                <SelectItem value="1-month">{language === "ar" ? "شهر" : "1 Month"}</SelectItem>
                                <SelectItem value="2-months">{language === "ar" ? "شهران" : "2 Months"}</SelectItem>
                                <SelectItem value="3-months">{language === "ar" ? "ثلاثة أشهر" : "3 Months"}</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="howDidYouHear" render={({ field }) => (
                        <FormItem><FormLabel>{language === "ar" ? "كيف عرفت عن الوظيفة؟" : "How did you hear about us?"}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder={language === "ar" ? "اختر..." : "Select..."} /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="website">{language === "ar" ? "موقع نوى" : "Nawa Website"}</SelectItem>
                              <SelectItem value="linkedin">LinkedIn</SelectItem>
                              <SelectItem value="twitter">{language === "ar" ? "تويتر / X" : "Twitter / X"}</SelectItem>
                              <SelectItem value="instagram">Instagram</SelectItem>
                              <SelectItem value="referral">{language === "ar" ? "ترشيح صديق" : "Friend Referral"}</SelectItem>
                              <SelectItem value="other">{language === "ar" ? "أخرى" : "Other"}</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="coverLetter" render={({ field }) => (
                        <FormItem><FormLabel>{language === "ar" ? "رسالة إضافية (اختياري)" : "Additional cover letter (optional)"}</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl></FormItem>
                      )} />
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-between gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={goPrev} disabled={step === 1} className="gap-1">
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />{language === "ar" ? "السابق" : "Previous"}
                </Button>
                {step < STEPS.length ? (
                  <Button type="button" onClick={goNext} className="gap-1">
                    {language === "ar" ? "التالي" : "Next"}<ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={applyMutation.isPending} className="gap-2 min-w-[160px]">
                    {applyMutation.isPending ? (language === "ar" ? "جاري الإرسال..." : "Submitting...") : (<>{language === "ar" ? "إرسال الطلب" : "Submit Application"}<Check className="w-4 h-4" /></>)}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
