import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
const logoPath = "/logo-transparent.png";
import { motion } from "framer-motion";
import { CheckCircle2, Lock } from "lucide-react";

const schema = z.object({
  password: z.string().min(8, "At least 8 characters"),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] });

export default function ResetPassword() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [done, setDone] = useState(false);
  const [, setLocation] = useLocation();

  const token = new URLSearchParams(window.location.search).get("token") || "";

  const form = useForm({ resolver: zodResolver(schema), defaultValues: { password: "", confirm: "" } });

  const onSubmit = async (data: { password: string }) => {
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      });
      const json = await res.json();
      if (res.ok) {
        setDone(true);
        setTimeout(() => setLocation("/auth/login"), 3000);
      } else {
        toast({ variant: "destructive", title: language === "ar" ? "خطأ" : "Error", description: json.error || (language === "ar" ? "رابط منتهي الصلاحية" : "Invalid or expired link") });
      }
    } catch {
      toast({ variant: "destructive", title: language === "ar" ? "خطأ" : "Error", description: language === "ar" ? "تعذر الاتصال" : "Connection error" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/10 p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-border">
        <div className="text-center mb-8">
          <img src={logoPath} alt="Nawa" className="h-12 mx-auto mb-6" />
          {done ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">{language === "ar" ? "تم بنجاح!" : "Done!"}</h2>
              <p className="text-muted-foreground text-sm">{language === "ar" ? "تم تغيير كلمة المرور. سيتم توجيهك لصفحة الدخول..." : "Password changed. Redirecting to login..."}</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">{language === "ar" ? "تعيين كلمة مرور جديدة" : "Set New Password"}</h2>
              <p className="text-muted-foreground text-sm">{language === "ar" ? "أدخل كلمة مرور جديدة لحسابك" : "Enter a new password for your account"}</p>
            </>
          )}
        </div>

        {!done && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === "ar" ? "كلمة المرور الجديدة" : "New Password"}</FormLabel>
                  <FormControl><Input type="password" dir="ltr" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="confirm" render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"}</FormLabel>
                  <FormControl><Input type="password" dir="ltr" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full h-12" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (language === "ar" ? "جاري الحفظ..." : "Saving...") : (language === "ar" ? "حفظ كلمة المرور" : "Save Password")}
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
