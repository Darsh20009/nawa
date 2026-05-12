import { useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/constants";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
const logoPath = "/logo-transparent.png";
import { motion } from "framer-motion";
import { LogIn, Building2, Users, Lock } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { language } = useLanguage();
  const t = translations[language];
  const { login: authLogin, isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    document.title = `${t.login} | نوى العقارية`;
    if (isAuthenticated && user) {
      if (user.role.includes("admin")) {
        setLocation("/admin");
      } else {
        setLocation("/employee");
      }
    }
  }, [t.login, isAuthenticated, user, setLocation]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        authLogin(data.token, data.user);
        setAuthTokenGetter(() => data.token);
        toast({
          title: language === "ar" ? "مرحباً بك مجدداً" : "Welcome back",
          description: language === "ar" ? "تم تسجيل الدخول بنجاح" : "Logged in successfully",
        });
        if (data.user.role.includes("admin")) {
          setLocation("/admin");
        } else {
          setLocation("/employee");
        }
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: language === "ar" ? "فشل تسجيل الدخول" : "Login Failed",
          description: language === "ar" ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" : "Invalid email or password",
        });
      },
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({ data });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-muted/10" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Visual Section */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-primary relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0">
          <img src="/images/hero-1.png" alt="Nawa Real Estate" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70" />
        </div>
        <div className="relative z-10 p-12 max-w-lg">
          <img src={logoPath} alt="Nawa" className="h-14 mb-8 brightness-0 invert" />
          <h1 className="text-4xl lg:text-5xl font-bold font-serif mb-6 leading-tight text-white">
            {language === "ar" ? "مرحباً بك في نوى العقارية" : "Welcome to Nawa Real Estate Platform"}
          </h1>
          <p className="text-lg text-white/70 mb-10 leading-relaxed">
            {language === "ar" ? "شركة استثمار عقاري متكاملة بمعايير عالمية" : "an integrated real estate investment company with global standards"}
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white/80">
              <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-secondary" />
              </div>
              <span className="text-sm">{language === "ar" ? "لوحة تحكم شاملة للمشاريع العقارية" : "Comprehensive real estate project dashboard"}</span>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-secondary" />
              </div>
              <span className="text-sm">{language === "ar" ? "بوابة الموظفين والتواصل الداخلي" : "Employee portal and internal communication"}</span>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-secondary" />
              </div>
              <span className="text-sm">{language === "ar" ? "نظام آمن ومحمي بتشفير متقدم" : "Secure system with advanced encryption"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-border"
        >
          <div className="text-center mb-8">
            <img src={logoPath} alt="Nawa" className="h-12 mx-auto mb-5" />
            <h2 className="text-2xl font-bold text-foreground mb-1">{t.login}</h2>
            <p className="text-muted-foreground text-sm">
              {language === "ar" ? "سجّل دخولك — للإدارة والموظفين" : "Sign in — for admins and employees"}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.email}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        dir="ltr"
                        placeholder={language === "ar" ? "بريدك الإلكتروني" : "your@nawainv.sa"}
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>{t.password}</FormLabel>
                      <Link href="/auth/forgot-password">
                        <span className="text-xs text-primary hover:underline cursor-pointer">
                          {language === "ar" ? "نسيت كلمة المرور؟" : "Forgot password?"}
                        </span>
                      </Link>
                    </div>
                    <FormControl>
                      <Input type="password" dir="ltr" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    {language === "ar" ? "جاري التحقق..." : "Verifying..."}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="w-5 h-5" />
                    {t.login}
                  </span>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 p-4 bg-muted/30 rounded-xl border border-border/50">
            <p className="text-xs text-muted-foreground text-center">
              {language === "ar"
                ? "هذه البوابة مخصصة للإدارة والموظفين فقط. للاستفسارات، تواصل معنا عبر صفحة التواصل."
                : "This portal is for admins and employees only. For inquiries, contact us via the contact page."}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
