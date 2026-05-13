import { useEffect } from "react";
import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { AIChatWidget } from "@/components/shared/ai-chat-widget";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <AIChatWidget />
    </div>
  );
}