import { AiChat } from "@/components/shared/ai-chat";
import { useLanguage } from "@/hooks/use-language";
import { useEffect } from "react";

export default function AdminAiPage() {
  const { language } = useLanguage();
  
  useEffect(() => {
    document.title = language === "ar" ? "نوى مي | نوى العقارية" : "Nawa Me | Nawa Real Estate Platform";
  }, [language]);

  return <AiChat />;
}