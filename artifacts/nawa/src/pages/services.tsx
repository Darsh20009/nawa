import { useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/constants";
import { motion } from "framer-motion";
import { useListServices } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import * as Icons from "lucide-react";

export default function Services() {
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    document.title = `${t.services} | نوى العقارية`;
  }, [t.services]);

  const { data: services, isLoading } = useListServices({
    query: { queryKey: ["services"] }
  });

  return (
    <div className="min-h-screen bg-muted/10">
      <PageHeader
        eyebrow={language === "ar" ? "ما نقدمه" : "What We Offer"}
        title={language === "ar" ? "خدماتنا" : "Our Services"}
        subtitle={
          language === "ar"
            ? "باقة متكاملة من الخدمات العقارية المصممة بعناية لتلبية تطلعاتك الاستثمارية"
            : "An integrated suite of real estate services carefully designed to meet your investment aspirations"
        }
      />

      <div className="container mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-border shadow-sm">
                <Skeleton className="w-14 h-14 rounded-xl mb-6" />
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ))
          ) : services && services.length > 0 ? (
            services.map((service, index) => {
              const IconComponent = service.icon && (Icons as any)[service.icon]
                ? (Icons as any)[service.icon]
                : Icons.Briefcase;

              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.07 }}
                  className="bg-white rounded-2xl p-8 border border-border hover:shadow-xl hover:border-secondary/20 transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="absolute top-0 start-0 w-1 h-full bg-gradient-to-b from-secondary/0 via-secondary/60 to-secondary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="w-14 h-14 rounded-xl bg-primary/5 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <IconComponent className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold font-serif mb-3 text-foreground group-hover:text-primary transition-colors">
                    {language === "ar" ? service.titleAr : service.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {language === "ar" ? service.descriptionAr : service.description}
                  </p>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-20 text-muted-foreground">
              {language === "ar" ? "لا توجد خدمات متاحة حالياً" : "No services available currently"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
