import { useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/constants";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import logoPath from "@assets/Screenshot_2026-05-12_at_1.51.13_PM_1778583134608.png";
import { motion } from "framer-motion";
import { LogIn } from "lucide-react";

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
    document.title = `${t.login} | منصة نوى العقارية`;
    
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
    defaultValues: {
      email: "",
      password: "",
    },
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
      onError: (error) => {
        toast({
          variant: "destructive",
          title: language === "ar" ? "فشل تسجيل الدخول" : "Login Failed",
          description: language === "ar" ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" : "Invalid email or password",
        });
      }
    }
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({ data });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-muted/10">
      {/* Visual Section */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-primary relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0">
          <img 
            src="/images/hero-1.png" 
            alt="Nawa Real Estate" 
            className="w-full h-full object-cover opacity-30 mix-blend-overlay"
          />
        </div>
        <div className="relative z-10 p-12 text-center text-white">
          <h1 className="text-4xl lg:text-5xl font-bold font-serif mb-6 leading-tight">
            {language === "ar" ? "نصنع مستقبلاً عقارياً رائداً" : "Building a leading real estate future"}
          </h1>
          <p className="text-lg lg:text-xl text-white/80 max-w-lg mx-auto">
            {language === "ar" 
              ? "منصة استثمارية عقارية متكاملة بمعايير عالمية"
              : "An integrated real estate investment platform with global standards"}
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-border"
        >
          <div className="text-center mb-10">
            <img src={logoPath} alt="Nawa" className="h-12 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-2">{t.login}</h2>
            <p className="text-muted-foreground text-sm">
              {language === "ar" ? "قم بتسجيل الدخول للوصول إلى لوحة التحكم" : "Sign in to access your dashboard"}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.email}</FormLabel>
                    <FormControl>
                      <Input type="email" dir="ltr" placeholder="admin@nawainv.sa" {...field} />
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
                    </div>
                    <FormControl>
                      <Input type="password" dir="ltr" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-12 text-lg" 
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
        </motion.div>
      </div>
    </div>
  );
}