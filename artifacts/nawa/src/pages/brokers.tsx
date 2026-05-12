import { useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/constants";
import { motion } from "framer-motion";
import { useListBrokers } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Award, MapPin, Mail, Phone } from "lucide-react";

export default function Brokers() {
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    document.title = `${t.brokers} | منصة نوى العقارية`;
  }, [t.brokers]);

  const { data: brokers, isLoading } = useListBrokers({
    query: {
      queryKey: ["brokers"]
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
            {t.brokers}
          </h1>
          <p className="text-lg text-muted-foreground">
            {language === "ar" 
              ? "نخبة من المستشارين العقاريين المعتمدين لتقديم أفضل التوصيات والحلول الاستثمارية التي تناسب تطلعاتك."
              : "A select group of certified real estate consultants to provide the best recommendations and investment solutions that suit your aspirations."}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-border shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <div>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6 mb-6" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-1/2 rounded-full" />
                  <Skeleton className="h-8 w-1/2 rounded-full" />
                </div>
              </div>
            ))
          ) : brokers && brokers.length > 0 ? (
            brokers.filter(b => b.active).map((broker, index) => (
              <motion.div
                key={broker.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-border shadow-sm hover:shadow-xl transition-all duration-300 group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 border border-border">
                    {broker.avatar ? (
                      <img 
                        src={broker.avatar} 
                        alt={language === "ar" ? broker.nameAr : broker.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center text-xl text-primary font-bold">
                        {(language === "ar" ? broker.nameAr : broker.name).charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold font-serif text-foreground group-hover:text-primary transition-colors">
                      {language === "ar" ? broker.nameAr : broker.name}
                    </h3>
                    <p className="text-sm text-secondary font-medium">
                      {language === "ar" ? broker.specializationAr : broker.specialization}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4 text-sm font-medium">
                  {broker.rating && (
                    <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-md">
                      <Star className="w-4 h-4 fill-current" />
                      <span>{broker.rating.toFixed(1)}</span>
                    </div>
                  )}
                  {broker.dealsCount && (
                    <div className="flex items-center gap-1 bg-primary/5 text-primary px-2 py-1 rounded-md">
                      <Award className="w-4 h-4" />
                      <span>{broker.dealsCount} {language === "ar" ? "صفقة" : "Deals"}</span>
                    </div>
                  )}
                </div>

                <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-3">
                  {language === "ar" ? broker.bioAr : broker.bio}
                </p>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                  {broker.email && (
                    <a 
                      href={`mailto:${broker.email}`} 
                      className="inline-flex items-center gap-2 text-xs font-medium text-foreground bg-muted px-3 py-1.5 rounded-full hover:bg-primary hover:text-white transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {language === "ar" ? "مراسلة" : "Email"}
                    </a>
                  )}
                  {broker.phone && (
                    <a 
                      href={`tel:${broker.phone}`} 
                      className="inline-flex items-center gap-2 text-xs font-medium text-foreground bg-muted px-3 py-1.5 rounded-full hover:bg-primary hover:text-white transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {language === "ar" ? "اتصال" : "Call"}
                    </a>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-white rounded-xl border border-border">
              <p className="text-xl text-muted-foreground">
                {language === "ar" ? "لا يوجد وسطاء متاحين حالياً" : "No brokers available currently"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}