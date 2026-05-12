import { InternalChat } from "@/components/shared/internal-chat";
import { useLanguage } from "@/hooks/use-language";
import { useEffect } from "react";

export default function EmployeeChatPage() {
  const { language } = useLanguage();
  
  useEffect(() => {
    document.title = language === "ar" ? "المحادثات | نوى العقارية" : "Internal Chat | Nawa Real Estate Platform";
  }, [language]);

  return <InternalChat />;
}