import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { Link } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
const logoPath = "/logo-transparent.png";
import { motion } from "framer-motion";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";

const schema = z.object({
  email: z.string().email(),
});

export default function ForgotPassword() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [sent, setSent] = useState(false);

  const form = useForm({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  const onSubmit = async (data: { email: string }) => {
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSent(true);
      } else {
        toast({ variant: "destructive", title: language === "ar" ? "خطأ" : "Error", description: language === "ar" ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong" });
      }
    } catch {
      toast({ variant: "destructive", title: language === "ar" ? "خطأ" : "Error", description: language === "ar" ? "تعذر الاتصال بالخادم" : "Could not reach server" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/10 p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-border">
        <div className="text-center mb-8">
          <img src={logoPath} alt="Nawa" className="h-12 mx-auto mb-6" />
          {sent ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">{language === "ar" ? "تم الإرسال!" : "Email Sent!"}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {language === "ar" ? "إذا كان البريد الإلكتروني مسجلاً، ستصل إليك رسالة لإعادة تعيين كلمة المرور خلال دقائق." : "If that email is registered, you'll receive a password reset link within minutes."}
              </p>
              <Link href="/auth/login">
                <Button className="mt-6 w-full">{language === "ar" ? "العودة لتسجيل الدخول" : "Back to Login"}</Button>
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-foreground mb-2">{language === "ar" ? "نسيت كلمة المرور؟" : "Forgot Password?"}</h2>
              <p className="text-muted-foreground text-sm">{language === "ar" ? "أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين" : "Enter your email and we'll send you a reset link"}</p>
            </>
          )}
        </div>

        {!sent && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === "ar" ? "البريد الإلكتروني" : "Email"}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rtl:right-3 ltr:left-3 ltr:right-auto" />
                      <Input type="email" dir="ltr" placeholder="you@nawainv.sa" className="pr-10 ltr:pl-10 ltr:pr-4" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full h-12" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <span className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />{language === "ar" ? "جاري الإرسال..." : "Sending..."}</span>
                ) : (
                  <span className="flex items-center gap-2"><ArrowRight className="w-4 h-4 rtl:-scale-x-100" />{language === "ar" ? "إرسال رابط الاسترداد" : "Send Reset Link"}</span>
                )}
              </Button>
              <div className="text-center">
                <Link href="/auth/login">
                  <span className="text-sm text-primary hover:underline cursor-pointer">{language === "ar" ? "العودة لتسجيل الدخول" : "Back to login"}</span>
                </Link>
              </div>
            </form>
          </Form>
        )}
      </motion.div>
    </div>
  );
}
