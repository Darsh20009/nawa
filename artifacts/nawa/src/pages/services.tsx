import { useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/constants";
import { motion } from "framer-motion";
import { useListServices } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import * as Icons from "lucide-react";

export default function Services() {
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    document.title = `${t.services} | منصة نوى العقارية`;
  }, [t.services]);

  const { data: services, isLoading } = useListServices({
    query: {
      queryKey: ["services"]
    }
  });

  return (
    <div className="pt-24 pb-20 min-h-screen bg-muted/20">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold font-serif mb-6 text-primary">
            {t.services}
          </h1>
          <p className="text-lg text-muted-foreground">
            {language === "ar" 
              ? "نقدم باقة متكاملة من الخدمات العقارية المصممة بعناية لتلبية تطلعاتك الاستثمارية وتحقيق أهدافك بتميز."
              : "We offer an integrated suite of real estate services carefully designed to meet your investment aspirations and achieve your goals with excellence."}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-border shadow-sm">
                <Skeleton className="w-12 h-12 rounded-lg mb-6" />
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ))
          ) : services && services.length > 0 ? (
            services.map((service, index) => {
              const IconComponent = service.icon && (Icons as any)[service.icon] ? (Icons as any)[service.icon] : Icons.Briefcase;
              
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-8 border border-border shadow-sm hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/5 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <IconComponent className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold font-serif mb-4 text-foreground">
                    {language === "ar" ? service.titleAr : service.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {language === "ar" ? service.descriptionAr : service.description}
                  </p>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-20 text-muted-foreground">
              No services available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}