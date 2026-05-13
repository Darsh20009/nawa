import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import { useState, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PwaInstallPrompt } from "@/components/shared/pwa-install-prompt";
const logoPath = "/logo-transparent.png";

setBaseUrl(import.meta.env.BASE_URL.replace(/\/$/, ""));
setAuthTokenGetter(() => localStorage.getItem("nawa_token") || "");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 60_000,
      gcTime: 5 * 60_000,
    },
  },
});

// Layouts (eager — small + needed immediately)
import { ClientLayout } from "@/components/layout/client-layout";
import { AdminLayout } from "@/components/layout/admin-layout";
import { EmployeeLayout } from "@/components/layout/employee-layout";

// Eager: home + landing essentials (first paint)
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";

// Lazy: every other route (code-split per chunk)
const About = lazy(() => import("@/pages/about"));
const Services = lazy(() => import("@/pages/services"));
const Projects = lazy(() => import("@/pages/projects"));
const ProjectDetail = lazy(() => import("@/pages/project-detail"));
const Board = lazy(() => import("@/pages/board"));
const Media = lazy(() => import("@/pages/media"));
const MediaDetail = lazy(() => import("@/pages/media-detail"));
const Careers = lazy(() => import("@/pages/careers"));
const Brokers = lazy(() => import("@/pages/brokers"));
const Contact = lazy(() => import("@/pages/contact"));
const Privacy = lazy(() => import("@/pages/privacy"));
const Terms = lazy(() => import("@/pages/terms"));
const Tips = lazy(() => import("@/pages/tips"));
const Login = lazy(() => import("@/pages/auth/login"));
const ForgotPassword = lazy(() => import("@/pages/auth/forgot-password"));
const ResetPassword = lazy(() => import("@/pages/auth/reset-password"));

const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const AdminProjects = lazy(() => import("@/pages/admin/projects"));
const AdminServices = lazy(() => import("@/pages/admin/services"));
const AdminNews = lazy(() => import("@/pages/admin/news"));
const AdminJobs = lazy(() => import("@/pages/admin/jobs"));
const AdminBrokers = lazy(() => import("@/pages/admin/brokers"));
const AdminBoard = lazy(() => import("@/pages/admin/board"));
const AdminEmployees = lazy(() => import("@/pages/admin/employees"));
const AdminApplications = lazy(() => import("@/pages/admin/applications"));
const AdminMessages = lazy(() => import("@/pages/admin/messages"));
const AdminPages = lazy(() => import("@/pages/admin/pages"));
const AdminAiPage = lazy(() => import("@/pages/admin/ai"));
const AdminAiConversations = lazy(() => import("@/pages/admin/ai-conversations"));
const AdminChatPage = lazy(() => import("@/pages/admin/chat"));
const AdminEmailPage = lazy(() => import("@/pages/admin/email"));
const AdminEmailAccounts = lazy(() => import("@/pages/admin/email-accounts"));
const AdminSettings = lazy(() => import("@/pages/admin/settings"));

const EmployeeDashboard = lazy(() => import("@/pages/employee/dashboard"));
const EmployeeInbox = lazy(() => import("@/pages/employee/inbox"));
const EmployeeAiPage = lazy(() => import("@/pages/employee/ai"));
const EmployeeChatPage = lazy(() => import("@/pages/employee/chat"));
const EmployeeEmailPage = lazy(() => import("@/pages/employee/email"));

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
    </div>
  );
}

function SplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0D1B3E]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative"
      >
        <img src={logoPath} alt="Nawa Real Estate" className="h-24 brightness-0 invert" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeInOut" }}
          style={{ width: "50%" }}
        />
      </motion.div>
    </motion.div>
  );
}

function AnimatedRouter() {
  const [location] = useLocation();

  const isAdminRoute = location.startsWith("/admin");
  const isEmployeeRoute = location.startsWith("/employee");
  const isAuthRoute = location.startsWith("/auth");

  if (isAdminRoute) {
    return (
      <AdminLayout>
        <Suspense fallback={<PageFallback />}>
          <Switch location={location}>
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/admin/projects" component={AdminProjects} />
            <Route path="/admin/services" component={AdminServices} />
            <Route path="/admin/news" component={AdminNews} />
            <Route path="/admin/jobs" component={AdminJobs} />
            <Route path="/admin/applications" component={AdminApplications} />
            <Route path="/admin/brokers" component={AdminBrokers} />
            <Route path="/admin/board" component={AdminBoard} />
            <Route path="/admin/employees" component={AdminEmployees} />
            <Route path="/admin/messages" component={AdminMessages} />
            <Route path="/admin/pages" component={AdminPages} />
            <Route path="/admin/ai" component={AdminAiPage} />
            <Route path="/admin/ai-conversations" component={AdminAiConversations} />
            <Route path="/admin/chat" component={AdminChatPage} />
            <Route path="/admin/email" component={AdminEmailPage} />
            <Route path="/admin/email-accounts" component={AdminEmailAccounts} />
            <Route path="/admin/settings" component={AdminSettings} />
            <Route component={() => <div className="p-6">Page under construction</div>} />
          </Switch>
        </Suspense>
      </AdminLayout>
    );
  }

  if (isEmployeeRoute) {
    return (
      <EmployeeLayout>
        <Suspense fallback={<PageFallback />}>
          <Switch location={location}>
            <Route path="/employee" component={EmployeeDashboard} />
            <Route path="/employee/chat" component={EmployeeChatPage} />
            <Route path="/employee/inbox" component={EmployeeInbox} />
            <Route path="/employee/ai" component={EmployeeAiPage} />
            <Route path="/employee/email" component={EmployeeEmailPage} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </EmployeeLayout>
    );
  }

  if (location === "/tips") {
    return (
      <Suspense fallback={<PageFallback />}>
        <Tips />
      </Suspense>
    );
  }

  if (isAuthRoute) {
    return (
      <Suspense fallback={<PageFallback />}>
        <Switch location={location}>
          <Route path="/auth/login" component={Login} />
          <Route path="/auth/forgot-password" component={ForgotPassword} />
          <Route path="/auth/reset-password" component={ResetPassword} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    );
  }

  return (
    <ClientLayout>
      <AnimatePresence mode="wait">
        <motion.div
          key={location}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="h-full flex flex-col"
        >
          <Suspense fallback={<PageFallback />}>
            <Switch location={location}>
              <Route path="/" component={Home} />
              <Route path="/about" component={About} />
              <Route path="/services" component={Services} />
              <Route path="/projects" component={Projects} />
              <Route path="/projects/:id" component={ProjectDetail} />
              <Route path="/board" component={Board} />
              <Route path="/media" component={Media} />
              <Route path="/media/:id" component={MediaDetail} />
              <Route path="/careers" component={Careers} />
              <Route path="/brokers" component={Brokers} />
              <Route path="/contact" component={Contact} />
              <Route path="/privacy" component={Privacy} />
              <Route path="/terms" component={Terms} />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </ClientLayout>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem("nawa_splash_shown"));

  const handleSplashComplete = () => {
    sessionStorage.setItem("nawa_splash_shown", "true");
    setShowSplash(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AnimatePresence>
          {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
        </AnimatePresence>

        {!showSplash && (
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AnimatedRouter />
          </WouterRouter>
        )}
        <PwaInstallPrompt />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
