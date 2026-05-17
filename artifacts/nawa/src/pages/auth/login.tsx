import { useEffect, useState } from "react";
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
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, Building2, Users, Lock, Fingerprint, Loader2, CheckCircle2 } from "lucide-react";
import { useBiometricLogin, useBiometricRegister, useHasBiometric, useBiometricSupport } from "@/hooks/use-biometric";
const logoPath = "/logo-transparent.png";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { language } = useLanguage();
  const t = translations[language];
  const ar = language === "ar";
  const { login: authLogin, isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const biometricSupported = useBiometricSupport();

  // Track last logged-in token for biometric registration offer
  const [justLoggedInToken, setJustLoggedInToken] = useState<string | null>(null);
  const [showRegisterBiometric, setShowRegisterBiometric] = useState(false);

  useEffect(() => {
    document.title = `${t.login} | نوى العقارية`;
    if (isAuthenticated && user && !justLoggedInToken) {
      if (user.role.includes("admin")) setLocation("/admin");
      else setLocation("/employee");
    }
  }, [t.login, isAuthenticated, user, setLocation, justLoggedInToken]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const watchedEmail = form.watch("email");
  const hasBiometric = useHasBiometric(watchedEmail);

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data: any) => {
        authLogin(data.token, data.user);
        setAuthTokenGetter(() => data.token);
        if (biometricSupported && !hasBiometric) {
          setJustLoggedInToken(data.token);
          setShowRegisterBiometric(true);
        } else {
          toast({
            title: ar ? "مرحباً بك مجدداً" : "Welcome back",
            description: ar ? "تم تسجيل الدخول بنجاح" : "Logged in successfully",
          });
          if (data.user.role.includes("admin")) setLocation("/admin");
          else setLocation("/employee");
        }
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: ar ? "فشل تسجيل الدخول" : "Login Failed",
          description: ar ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" : "Invalid email or password",
        });
      },
    },
  });

  const { loginWithBiometric, loading: bioLoading, error: bioError, setError: setBioError } = useBiometricLogin();
  const { registerBiometric, loading: regLoading, registered: regDone } = useBiometricRegister();

  const onSubmit = (data: LoginFormValues) => loginMutation.mutate({ data });

  const handleBiometricLogin = () => {
    const email = form.getValues("email");
    if (!email || !email.includes("@")) {
      toast({ variant: "destructive", title: ar ? "أدخل بريدك الإلكتروني أولاً" : "Enter your email first" });
      return;
    }
    loginWithBiometric(email, (loggedUser) => {
      toast({ title: ar ? "مرحباً بك 👋" : "Welcome back 👋", description: ar ? "تم التحقق من البصمة بنجاح" : "Biometric verified" });
      if (loggedUser.role.includes("admin")) setLocation("/admin");
      else setLocation("/employee");
    });
  };

  const handleRegisterBiometric = async () => {
    if (!justLoggedInToken) return;
    await registerBiometric(justLoggedInToken, ar ? "جهازي" : "My Device");
  };

  const handleSkipBiometric = () => {
    setShowRegisterBiometric(false);
    setJustLoggedInToken(null);
    toast({ title: ar ? "مرحباً بك مجدداً" : "Welcome back" });
    if (user?.role.includes("admin")) setLocation("/admin");
    else setLocation("/employee");
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-muted/10" dir={ar ? "rtl" : "ltr"}>
      {/* Visual Section */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-primary relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0">
          <img src="/images/hero-1.png" alt="Nawa Real Estate" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70" />
        </div>
        <div className="relative z-10 p-12 max-w-lg">
          <img src={logoPath} alt="Nawa" className="h-14 mb-8 brightness-0 invert" />
          <h1 className="text-4xl lg:text-5xl font-bold font-serif mb-6 leading-tight text-white">
            {ar ? "مرحباً بك في نوى العقارية" : "Welcome to Nawa Real Estate Platform"}
          </h1>
          <p className="text-lg text-white/70 mb-10 leading-relaxed">
            {ar ? "شركة استثمار عقاري متكاملة بمعايير عالمية" : "an integrated real estate investment company with global standards"}
          </p>
          <div className="space-y-4">
            {[
              { icon: Building2, text: ar ? "لوحة تحكم شاملة للمشاريع العقارية" : "Comprehensive real estate project dashboard" },
              { icon: Users, text: ar ? "بوابة الموظفين والتواصل الداخلي" : "Employee portal and internal communication" },
              { icon: Lock, text: ar ? "نظام آمن ومحمي بتشفير متقدم" : "Secure system with advanced encryption" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-white/80">
                <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-secondary" />
                </div>
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <AnimatePresence mode="wait">
          {/* ── Biometric Registration Offer ─────────────────────────────── */}
          {showRegisterBiometric ? (
            <motion.div
              key="biometric-register"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-border text-center"
            >
              {regDone ? (
                <>
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{ar ? "تم تفعيل البصمة!" : "Biometric Enabled!"}</h2>
                  <p className="text-muted-foreground mb-6 text-sm">
                    {ar ? "يمكنك الآن تسجيل الدخول بلمسة واحدة في المرات القادمة" : "You can now sign in with one touch next time"}
                  </p>
                  <Button className="w-full" onClick={handleSkipBiometric}>
                    {ar ? "ابدأ الاستخدام" : "Get Started"}
                  </Button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5 animate-pulse">
                    <Fingerprint className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{ar ? "فعّل تسجيل الدخول بالبصمة" : "Enable Fingerprint Login"}</h2>
                  <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                    {ar
                      ? "سجّل بصمتك مرة واحدة وادخل بلمسة سريعة في كل مرة دون الحاجة لكلمة المرور"
                      : "Register your fingerprint once and sign in with a single touch — no password needed"}
                  </p>
                  <div className="space-y-3">
                    <Button
                      className="w-full h-12 gap-2 text-base"
                      onClick={handleRegisterBiometric}
                      disabled={regLoading}
                    >
                      {regLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Fingerprint className="w-5 h-5" />}
                      {ar ? "تفعيل البصمة الآن" : "Enable Fingerprint Now"}
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={handleSkipBiometric}>
                      {ar ? "تخطي هذه الخطوة" : "Skip for now"}
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            /* ── Login Form ──────────────────────────────────────────────── */
            <motion.div
              key="login-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-border"
            >
              <div className="text-center mb-8">
                <img src={logoPath} alt="Nawa" className="h-12 mx-auto mb-5" />
                <h2 className="text-2xl font-bold text-foreground mb-1">{t.login}</h2>
                <p className="text-muted-foreground text-sm">
                  {ar ? "سجّل دخولك — للإدارة والموظفين" : "Sign in — for admins and employees"}
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
                            placeholder={ar ? "بريدك الإلكتروني" : "your@nawainv.sa"}
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
                              {ar ? "نسيت كلمة المرور؟" : "Forgot password?"}
                            </span>
                          </Link>
                        </div>
                        <FormControl>
                          <PasswordInput dir="ltr" autoComplete="current-password" {...field} />
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
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {ar ? "جاري التحقق..." : "Verifying..."}
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

              {/* Biometric Login Button */}
              {biometricSupported && hasBiometric && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <div className="relative flex items-center gap-3 my-1">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">{ar ? "أو" : "or"}</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 gap-2 text-base mt-3 border-primary/30 hover:border-primary hover:bg-primary/5 text-primary"
                    onClick={handleBiometricLogin}
                    disabled={bioLoading}
                  >
                    {bioLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Fingerprint className="w-5 h-5" />
                    )}
                    {bioLoading
                      ? (ar ? "جاري التحقق..." : "Verifying...")
                      : (ar ? "تسجيل الدخول بالبصمة" : "Sign in with Fingerprint")}
                  </Button>
                  {bioError && (
                    <p className="text-xs text-destructive text-center mt-2">{bioError}</p>
                  )}
                </motion.div>
              )}

              <div className="mt-6 p-4 bg-muted/30 rounded-xl border border-border/50">
                <p className="text-xs text-muted-foreground text-center">
                  {ar
                    ? "هذه البوابة مخصصة للإدارة والموظفين فقط. للاستفسارات، تواصل معنا عبر صفحة التواصل."
                    : "This portal is for admins and employees only. For inquiries, contact us via the contact page."}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
