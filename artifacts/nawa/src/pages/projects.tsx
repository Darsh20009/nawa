import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/constants";
import { motion } from "framer-motion";
import { useListProjects } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { MapPin } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Projects() {
  const { language } = useLanguage();
  const t = translations[language];
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    document.title = `${t.projects} | منصة نوى العقارية`;
  }, [t.projects]);

  const { data: projects, isLoading } = useListProjects(
    statusFilter !== "all" ? { status: statusFilter } : {},
    {
      query: {
        queryKey: ["projects", statusFilter]
      }
    }
  );

  return (
    <div className="pb-20 min-h-screen bg-muted/10">
      {/* Video Banner Header */}
      <div className="relative h-[40vh] md:h-[50vh] flex items-center justify-center overflow-hidden">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/nawa-hero.mov" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/60 to-primary/80" />
        <div className="relative z-10 text-center text-white px-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="text-secondary uppercase tracking-widest text-xs md:text-sm font-bold mb-2 md:mb-3">Portfolio</p>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold font-serif">{t.projects}</h1>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <Tabs defaultValue="all" className="w-full mb-8" onValueChange={setStatusFilter}>
            <TabsList className="bg-white border border-border">
              <TabsTrigger value="all">{language === "ar" ? "الكل" : "All"}</TabsTrigger>
              <TabsTrigger value="planning">{t.planning}</TabsTrigger>
              <TabsTrigger value="active">{t.active}</TabsTrigger>
              <TabsTrigger value="completed">{t.completed}</TabsTrigger>
              <TabsTrigger value="sold_out">{t.sold_out}</TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-white shadow-sm border border-border">
                <Skeleton className="h-64 w-full" />
                <div className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))
          ) : projects && projects.length > 0 ? (
            projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group rounded-xl overflow-hidden bg-white shadow-sm border border-border hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                <Link href={`/projects/${project.id}`} className="flex-1 flex flex-col">
                  <div className="relative h-64 overflow-hidden shrink-0">
                    <img 
                      src={project.imageUrl || "/images/project-1.png"} 
                      alt={language === "ar" ? project.titleAr : project.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-4 left-4 z-20">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold rounded-full text-primary uppercase tracking-wider">
                        {t[project.status as keyof typeof t] || project.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h4 className="text-xl font-bold font-serif mb-2 group-hover:text-primary transition-colors">
                      {language === "ar" ? project.titleAr : project.title}
                    </h4>
                    <p className="text-muted-foreground flex items-center gap-2 mb-4 text-sm">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span className="truncate">{language === "ar" ? project.locationAr : project.location}</span>
                    </p>
                    
                    <div className="mt-auto">
                      <div className="w-full bg-muted rounded-full h-2 mb-2 overflow-hidden">
                        <div 
                          className="bg-secondary h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${project.completionPercentage || 0}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-muted-foreground">{t.completion}</span>
                        <span className="text-primary">{project.completionPercentage || 0}%</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-white rounded-xl border border-border">
              <p className="text-xl text-muted-foreground mb-2">
                {language === "ar" ? "لا توجد مشاريع متاحة حالياً" : "No projects available currently"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}