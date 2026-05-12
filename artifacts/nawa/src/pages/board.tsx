import { useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/constants";
import { motion } from "framer-motion";
import { useListBoardMembers } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Linkedin } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";

export default function Board() {
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    document.title = `${t.board} | منصة نوى العقارية`;
  }, [t.board]);

  const { data: members, isLoading } = useListBoardMembers({
    query: {
      queryKey: ["boardMembers"]
    }
  });

  return (
    <div className="min-h-screen bg-muted/10">
      <PageHeader
        eyebrow={language === "ar" ? "القيادة" : "Leadership"}
        title={language === "ar" ? "مجلس الإدارة" : "Board of Directors"}
        subtitle={language === "ar"
          ? "قيادات تتمتع بخبرات واسعة ورؤى استراتيجية تقود مسيرة نجاحنا"
          : "Leaders with extensive expertise and strategic vision guiding our success"}
      />
      <div className="container mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <Skeleton className="w-48 h-48 rounded-full mb-6" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))
          ) : members && members.length > 0 ? (
            members.sort((a, b) => (a.order || 0) - (b.order || 0)).map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group flex flex-col items-center text-center"
              >
                <div className="relative w-48 h-48 mb-6 rounded-full overflow-hidden border-4 border-white shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  {member.avatar ? (
                    <img 
                      src={member.avatar} 
                      alt={language === "ar" ? member.nameAr : member.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-4xl text-muted-foreground font-serif">
                      {(language === "ar" ? member.nameAr : member.name).charAt(0)}
                    </div>
                  )}
                  {member.linkedIn && (
                    <a 
                      href={member.linkedIn} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm"
                    >
                      <Linkedin className="w-8 h-8 text-white" />
                    </a>
                  )}
                </div>
                <h3 className="text-2xl font-bold font-serif text-foreground mb-1">
                  {language === "ar" ? member.nameAr : member.name}
                </h3>
                <p className="text-secondary font-medium mb-4">
                  {language === "ar" ? member.positionAr : member.position}
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {language === "ar" ? member.bioAr : member.bio}
                </p>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 text-muted-foreground">
              No board members listed.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}