import { create } from "zustand";
import { persist } from "zustand/middleware";

type Language = "ar" | "en";

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  isRtl: boolean;
}

export const useLanguage = create<LanguageState>()(
  persist(
    (set) => ({
      language: "ar",
      isRtl: true,
      setLanguage: (lang) => {
        document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
        document.documentElement.lang = lang;
        set({ language: lang, isRtl: lang === "ar" });
      },
      toggleLanguage: () => set((state) => {
        const newLang = state.language === "ar" ? "en" : "ar";
        document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
        document.documentElement.lang = newLang;
        return { language: newLang, isRtl: newLang === "ar" };
      }),
    }),
    {
      name: "nawa_language",
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.dir = state.language === "ar" ? "rtl" : "ltr";
          document.documentElement.lang = state.language;
        }
      },
    }
  )
);
