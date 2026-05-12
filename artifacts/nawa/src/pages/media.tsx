import { useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/constants";
import { motion } from "framer-motion";
import { useListNews } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Calendar, ArrowRight, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";

export default function Media() {
  const { language, isRtl } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    document.title = `${t.media} | نوى العقارية`;
  }, [t.media]);

  const { data: news, isLoading } = useListNews({}, {
    query: {
      queryKey: ["news"]
    }
  });

  return (
    <div className="min-h-screen bg-muted/10">
      <PageHeader
        eyebrow={language === "ar" ? "أخبار ومستجدات" : "News & Updates"}
        title={language === "ar" ? "المركز الإعلامي" : "Media Center"}
        subtitle={language === "ar"
          ? "آخر أخبار نوى العقارية والمستجدات من عالم الاستثمار العقاري"
          : "Latest news from Nawa Real Estate and the world of real estate investment"}
      />
      <div className="container mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-white shadow-sm border border-border">
                <Skeleton className="h-56 w-full" />
                <div className="p-6">
                  <Skeleton className="h-4 w-1/3 mb-4" />
                  <Skeleton className="h-6 w-full mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))
          ) : news && news.length > 0 ? (
            news.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group rounded-2xl overflow-hidden bg-white shadow-sm border border-border hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                <Link href={`/media/${article.id}`} className="flex-1 flex flex-col">
                  <div className="relative h-56 overflow-hidden shrink-0">
                    {article.imageUrl ? (
                      <img 
                        src={article.imageUrl} 
                        alt={language === "ar" ? article.titleAr : article.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-serif text-2xl opacity-30">NAWA</span>
                      </div>
                    )}
                    <div className="absolute top-4 left-4 z-20">
                      <span className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold rounded-full uppercase tracking-wider">
                        {article.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center text-sm text-muted-foreground mb-4 gap-2">
                      <Calendar className="w-4 h-4" />
                      {article.publishedAt ? format(new Date(article.publishedAt), 'MMM dd, yyyy') : ''}
                    </div>
                    <h3 className="text-xl font-bold font-serif mb-4 group-hover:text-primary transition-colors line-clamp-2">
                      {language === "ar" ? article.titleAr : article.title}
                    </h3>
                    <p className="text-muted-foreground line-clamp-3 mb-6 flex-1">
                      {language === "ar" ? article.contentAr : article.content}
                    </p>
                    <div className="mt-auto flex items-center text-primary font-medium group-hover:text-secondary transition-colors">
                      {t.readMore}
                      {isRtl ? <ArrowLeft className="mr-2 h-4 w-4" /> : <ArrowRight className="ml-2 h-4 w-4" />}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-white rounded-xl border border-border">
              <p className="text-xl text-muted-foreground">
                {language === "ar" ? "لا توجد أخبار متاحة حالياً" : "No news available currently"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}