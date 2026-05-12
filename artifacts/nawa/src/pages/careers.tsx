import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/constants";
import { motion } from "framer-motion";
import { useListJobs, useApplyForJob } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/shared/page-header";

const applySchema = z.object({
  applicantName: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  coverLetter: z.string().optional(),
  resumeUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type ApplyFormValues = z.infer<typeof applySchema>;

export default function Careers() {
  const { language } = useLanguage();
  const t = translations[language];
  const { toast } = useToast();
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  useEffect(() => {
    document.title = `${t.careers} | منصة نوى العقارية`;
  }, [t.careers]);

  const { data: jobs, isLoading } = useListJobs();

  const applyMutation = useApplyForJob({
    mutation: {
      onSuccess: () => {
        toast({
          title: language === "ar" ? "تم التقديم بنجاح" : "Application submitted successfully",
          description: language === "ar" ? "سنتواصل معك قريباً" : "We will contact you soon",
        });
        setSelectedJobId(null);
        form.reset();
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: language === "ar" ? "حدث خطأ" : "Error occurred",
          description: language === "ar" ? "فشل تقديم الطلب. يرجى المحاولة لاحقاً." : "Failed to submit application. Please try again.",
        });
      }
    }
  });

  const form = useForm<ApplyFormValues>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      applicantName: "",
      email: "",
      phone: "",
      coverLetter: "",
      resumeUrl: "",
    },
  });

  const onSubmit = (data: ApplyFormValues) => {
    if (selectedJobId) {
      applyMutation.mutate({
        id: selectedJobId,
        data: data
      });
    }
  };

  const activeJobs = jobs?.filter(j => j.active) || [];

  return (
    <div className="min-h-screen bg-muted/10">
      <PageHeader
        eyebrow={language === "ar" ? "انضم إلينا" : "Join Us"}
        title={language === "ar" ? "الوظائف" : "Careers"}
        subtitle={language === "ar"
          ? "كن جزءاً من فريقنا المتميز وابنِ مسيرتك المهنية في عالم الاستثمار العقاري"
          : "Be part of our distinguished team and build your career in real estate investment"}
      />
      <div className="container mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold font-serif mb-6 text-primary">
            {t.careers}
          </h1>
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
                  <div>
                    <Skeleton className="h-6 w-64 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-10 w-28 rounded-md" />
                </div>
                <div className="flex gap-4 mb-4">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-16 w-full" />
              </div>
            ))
          ) : activeJobs.length > 0 ? (
            activeJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 md:p-8 border border-border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                  <div>
                    <h3 className="text-2xl font-bold font-serif text-foreground mb-2">
                      {language === "ar" ? job.titleAr : job.title}
                    </h3>
                    <p className="text-primary font-medium">
                      {language === "ar" ? job.departmentAr : job.department}
                    </p>
                  </div>
                  <Button 
                    onClick={() => setSelectedJobId(job.id)}
                    className="shrink-0 md:w-auto w-full"
                  >
                    {t.applyNow}
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                  {job.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-secondary" />
                      <span>{job.location}</span>
                    </div>
                  )}
                  {job.type && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4 text-secondary" />
                      <span className="capitalize">{job.type.replace("-", " ")}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-secondary" />
                    <span>{language === "ar" ? "دوام كامل" : "Full Time"}</span>
                  </div>
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
              <p className="text-xl text-muted-foreground">
                {language === "ar" ? "لا توجد وظائف شاغرة حالياً" : "No open positions currently"}
              </p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={selectedJobId !== null} onOpenChange={(open) => !open && setSelectedJobId(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t.applyNow}</DialogTitle>
            <DialogDescription>
              {language === "ar" ? "يرجى تعبئة النموذج أدناه لتقديم طلبك." : "Please fill out the form below to submit your application."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="applicantName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.name}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.email}</FormLabel>
                      <FormControl>
                        <Input type="email" dir="ltr" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.phone}</FormLabel>
                      <FormControl>
                        <Input type="tel" dir="ltr" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="resumeUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "ar" ? "رابط السيرة الذاتية (LinkedIn أو ملف)" : "Resume URL (LinkedIn or file)"}</FormLabel>
                    <FormControl>
                      <Input type="url" dir="ltr" placeholder="https://" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="coverLetter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "ar" ? "رسالة تغطية (اختياري)" : "Cover Letter (Optional)"}</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={applyMutation.isPending}
                  className="w-full md:w-auto"
                >
                  {applyMutation.isPending ? (language === "ar" ? "جاري التقديم..." : "Submitting...") : t.applyNow}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}