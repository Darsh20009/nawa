import { useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/constants";
import { useGetNewsArticle } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ArrowLeft, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function MediaDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  const { language, isRtl } = useLanguage();
  const t = translations[language];

  const { data: article, isLoading } = useGetNewsArticle(id, {
    query: {
      enabled: !!id,
      queryKey: ["news", id]
    }
  });

  useEffect(() => {
    if (article) {
      document.title = `${language === "ar" ? article.titleAr : article.title} | نوى العقارية`;
    }
  }, [article, language]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
        <Skeleton className="h-8 w-24 mb-6" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-12 w-3/4 mb-8" />
        <Skeleton className="h-96 w-full rounded-2xl mb-12" />
        <Skeleton className="h-4 w-full mb-4" />
        <Skeleton className="h-4 w-full mb-4" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="pt-32 pb-20 text-center min-h-[60vh] flex items-center justify-center">
        <h2 className="text-2xl text-muted-foreground">Article not found</h2>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
      <Link href="/media" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors mb-8 font-medium">
        {isRtl ? <ArrowRight className="ml-2 w-4 h-4" /> : <ArrowLeft className="mr-2 w-4 h-4" />}
        {language === "ar" ? "العودة للمركز الإعلامي" : "Back to Media Center"}
      </Link>

      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-4 mb-6">
          <span className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold rounded-full uppercase tracking-wider">
            {article.category}
          </span>
          <span className="flex items-center text-sm text-muted-foreground gap-2">
            <Calendar className="w-4 h-4" />
            {article.publishedAt ? format(new Date(article.publishedAt), 'MMMM dd, yyyy') : ''}
          </span>
        </div>

        <h1 className="text-3xl md:text-5xl font-bold font-serif text-foreground mb-10 leading-tight">
          {language === "ar" ? article.titleAr : article.title}
        </h1>

        {article.imageUrl && (
          <div className="w-full rounded-2xl overflow-hidden mb-12 shadow-md">
            <img 
              src={article.imageUrl} 
              alt={language === "ar" ? article.titleAr : article.title} 
              className="w-full h-auto max-h-[600px] object-cover"
            />
          </div>
        )}

        <div className="prose prose-lg dark:prose-invert max-w-none prose-p:text-muted-foreground prose-headings:text-foreground prose-headings:font-serif">
          <div className="whitespace-pre-wrap leading-relaxed">
            {language === "ar" ? article.contentAr : article.content}
          </div>
        </div>
      </motion.article>
    </div>
  );
}