import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PwaInstallPrompt } from "@/components/shared/pwa-install-prompt";
const logoPath = "/logo-transparent.png";

// Setup API Client
setBaseUrl(import.meta.env.BASE_URL.replace(/\/$/, ""));
setAuthTokenGetter(() => localStorage.getItem("nawa_token") || "");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Layouts
import { ClientLayout } from "@/components/layout/client-layout";
import { AdminLayout } from "@/components/layout/admin-layout";
import { EmployeeLayout } from "@/components/layout/employee-layout";

// Client Pages
import Home from "@/pages/home";
import About from "@/pages/about";
import Services from "@/pages/services";
import Projects from "@/pages/projects";
import ProjectDetail from "@/pages/project-detail";
import Board from "@/pages/board";
import Media from "@/pages/media";
import MediaDetail from "@/pages/media-detail";
import Careers from "@/pages/careers";
import Brokers from "@/pages/brokers";
import Contact from "@/pages/contact";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import Tips from "@/pages/tips";
import Login from "@/pages/auth/login";
import ForgotPassword from "@/pages/auth/forgot-password";
import ResetPassword from "@/pages/auth/reset-password";
import NotFound from "@/pages/not-found";

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminProjects from "@/pages/admin/projects";
import AdminServices from "@/pages/admin/services";
import AdminNews from "@/pages/admin/news";
import AdminJobs from "@/pages/admin/jobs";
import AdminBrokers from "@/pages/admin/brokers";
import AdminBoard from "@/pages/admin/board";
import AdminEmployees from "@/pages/admin/employees";
import AdminApplications from "@/pages/admin/applications";
import AdminMessages from "@/pages/admin/messages";
import AdminPages from "@/pages/admin/pages";
import AdminAiPage from "@/pages/admin/ai";
import AdminChatPage from "@/pages/admin/chat";
import AdminEmailPage from "@/pages/admin/email";
import AdminEmailAccounts from "@/pages/admin/email-accounts";
import AdminSettings from "@/pages/admin/settings";

// Employee Pages
import EmployeeDashboard from "@/pages/employee/dashboard";
import EmployeeInbox from "@/pages/employee/inbox";
import EmployeeAiPage from "@/pages/employee/ai";
import EmployeeChatPage from "@/pages/employee/chat";
import EmployeeEmailPage from "@/pages/employee/email";

// Splash Screen Component
function SplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0D1B3E]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative"
      >
        <img src={logoPath} alt="Nawa Real Estate" className="h-24 brightness-0 invert" />
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
          style={{ width: "50%" }}
        />
      </motion.div>
    </motion.div>
  );
}

function AnimatedRouter() {
  const [location] = useLocation();

  const isAdminRoute = location.startsWith('/admin');
  const isEmployeeRoute = location.startsWith('/employee');
  const isAuthRoute = location.startsWith('/auth');

  if (isAdminRoute) {
    return (
      <AdminLayout>
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
          <Route path="/admin/chat" component={AdminChatPage} />
          <Route path="/admin/email" component={AdminEmailPage} />
          <Route path="/admin/email-accounts" component={AdminEmailAccounts} />
          <Route path="/admin/settings" component={AdminSettings} />
          <Route component={() => <div className="p-6">Page under construction</div>} />
        </Switch>
      </AdminLayout>
    );
  }

  if (isEmployeeRoute) {
    return (
      <EmployeeLayout>
        <Switch location={location}>
          <Route path="/employee" component={EmployeeDashboard} />
          <Route path="/employee/chat" component={EmployeeChatPage} />
          <Route path="/employee/inbox" component={EmployeeInbox} />
          <Route path="/employee/ai" component={EmployeeAiPage} />
          <Route path="/employee/email" component={EmployeeEmailPage} />
          <Route component={NotFound} />
        </Switch>
      </EmployeeLayout>
    );
  }

  if (location === "/tips") {
    return <Tips />;
  }

  if (isAuthRoute) {
    return (
      <Switch location={location}>
        <Route path="/auth/login" component={Login} />
        <Route path="/auth/forgot-password" component={ForgotPassword} />
        <Route path="/auth/reset-password" component={ResetPassword} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <ClientLayout>
      <AnimatePresence mode="wait">
        <motion.div
          key={location}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="h-full flex flex-col"
        >
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
        </motion.div>
      </AnimatePresence>
    </ClientLayout>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem("nawa_splash_shown");
  });

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