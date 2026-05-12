import { AiChat } from "@/components/shared/ai-chat";
import { useLanguage } from "@/hooks/use-language";
import { useEffect } from "react";

export default function EmployeeAiPage() {
  const { language } = useLanguage();
  
  useEffect(() => {
    document.title = language === "ar" ? "مساعد الذكاء الاصطناعي | نوى العقارية" : "AI Assistant | Nawa Real Estate Platform";
  }, [language]);

  return <AiChat />;
}