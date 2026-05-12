import { useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/constants";
import { motion } from "framer-motion";
import { useSendMessage } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  subject: z.string().min(2, "Subject is required"),
  content: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function Contact() {
  const { language } = useLanguage();
  const t = translations[language];
  const { toast } = useToast();

  useEffect(() => {
    document.title = `${t.contact} | منصة نوى العقارية`;
  }, [t.contact]);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      content: "",
    },
  });

  const sendMessageMutation = useSendMessage({
    mutation: {
      onSuccess: () => {
        toast({
          title: language === "ar" ? "تم الإرسال بنجاح" : "Message sent successfully",
          description: language === "ar" ? "شكراً لتواصلك معنا. سنرد عليك في أقرب وقت." : "Thank you for contacting us. We will reply as soon as possible.",
        });
        form.reset();
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: language === "ar" ? "حدث خطأ" : "Error occurred",
          description: language === "ar" ? "فشل إرسال الرسالة. يرجى المحاولة لاحقاً." : "Failed to send message. Please try again later.",
        });
      }
    }
  });

  const onSubmit = (data: ContactFormValues) => {
    sendMessageMutation.mutate({ data });
  };

  return (
    <div className="pt-24 pb-20 min-h-screen bg-muted/10">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold font-serif mb-6 text-primary">
            {t.contact}
          </h1>
          <p className="text-lg text-muted-foreground">
            {language === "ar" 
              ? "نسعد بتواصلكم معنا. فريقنا جاهز للإجابة على استفساراتكم وتقديم الدعم اللازم لبدء رحلتكم الاستثمارية."
              : "We are happy to hear from you. Our team is ready to answer your inquiries and provide the necessary support to start your investment journey."}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: language === "ar" ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-1 space-y-8"
          >
            <div className="bg-white p-8 rounded-2xl border border-border shadow-sm">
              <h3 className="text-2xl font-bold font-serif text-primary mb-6">{t.contactInfo}</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/5 text-primary rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1">{language === "ar" ? "العنوان" : "Address"}</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {language === "ar" 
                        ? "طريق الملك فهد، العليا\nالرياض 12214\nالمملكة العربية السعودية"
                        : "King Fahd Road, Olaya\nRiyadh 12214\nSaudi Arabia"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/5 text-primary rounded-xl flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1">{language === "ar" ? "الهاتف" : "Phone"}</h4>
                    <a href="tel:+966112345678" className="text-muted-foreground text-sm hover:text-primary transition-colors block mb-1" dir="ltr">
                      +966 11 234 5678
                    </a>
                    <a href="tel:+966500000000" className="text-muted-foreground text-sm hover:text-primary transition-colors block" dir="ltr">
                      +966 50 000 0000
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/5 text-primary rounded-xl flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1">{language === "ar" ? "البريد الإلكتروني" : "Email"}</h4>
                    <a href="mailto:info@nawainv.sa" className="text-muted-foreground text-sm hover:text-primary transition-colors block mb-1">
                      info@nawainv.sa
                    </a>
                    <a href="mailto:invest@nawainv.sa" className="text-muted-foreground text-sm hover:text-primary transition-colors block">
                      invest@nawainv.sa
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: language === "ar" ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-2"
          >
            <div className="bg-white p-8 md:p-10 rounded-2xl border border-border shadow-sm">
              <h3 className="text-2xl font-bold font-serif text-primary mb-6">{t.sendMessage}</h3>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.name}</FormLabel>
                          <FormControl>
                            <Input placeholder={language === "ar" ? "الاسم الكامل" : "Full Name"} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.email}</FormLabel>
                          <FormControl>
                            <Input type="email" dir="ltr" placeholder="email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.phone} ({language === "ar" ? "اختياري" : "Optional"})</FormLabel>
                          <FormControl>
                            <Input type="tel" dir="ltr" placeholder="+966" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.subject}</FormLabel>
                          <FormControl>
                            <Input placeholder={language === "ar" ? "موضوع الرسالة" : "Message Subject"} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.message}</FormLabel>
                        <FormControl>
                          <Textarea 
                            rows={6} 
                            placeholder={language === "ar" ? "اكتب رسالتك هنا..." : "Type your message here..."} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    size="lg"
                    className="w-full md:w-auto"
                    disabled={sendMessageMutation.isPending}
                  >
                    {sendMessageMutation.isPending ? (
                      language === "ar" ? "جاري الإرسال..." : "Sending..."
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                        {t.sendMessage}
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}