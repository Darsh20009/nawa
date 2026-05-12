import { useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/constants";
import { useGetProject } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Building, Ruler, Tag } from "lucide-react";
import { motion } from "framer-motion";

export default function ProjectDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  const { language } = useLanguage();
  const t = translations[language];

  const { data: project, isLoading } = useGetProject(id, {
    query: {
      enabled: !!id,
      queryKey: ["project", id]
    }
  });

  useEffect(() => {
    if (project) {
      document.title = `${language === "ar" ? project.titleAr : project.title} | منصة نوى العقارية`;
    }
  }, [project, language]);

  if (isLoading) {
    return (
      <div className="pt-20">
        <Skeleton className="h-[60vh] w-full" />
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-12 w-1/3 mb-6" />
          <Skeleton className="h-6 w-1/4 mb-12" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div>
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="pt-32 pb-20 text-center min-h-[60vh] flex items-center justify-center">
        <h2 className="text-2xl text-muted-foreground">Project not found</h2>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Hero Image */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        <img 
          src={project.imageUrl || "/images/project-1.png"} 
          alt={language === "ar" ? project.titleAr : project.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-4 py-1.5 bg-primary text-primary-foreground text-sm font-semibold rounded-full uppercase tracking-wider mb-4">
              {t[project.status as keyof typeof t] || project.status}
            </span>
            <h1 className="text-4xl md:text-6xl font-bold font-serif text-foreground mb-4 drop-shadow-sm">
              {language === "ar" ? project.titleAr : project.title}
            </h1>
            <p className="text-xl text-foreground/80 flex items-center gap-2 drop-shadow-sm">
              <MapPin className="w-5 h-5 text-secondary" />
              {language === "ar" ? project.locationAr : project.location}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold font-serif mb-6 text-primary">
                {language === "ar" ? "نظرة عامة على المشروع" : "Project Overview"}
              </h2>
              <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                {language === "ar" ? project.descriptionAr : project.description}
              </div>
            </motion.div>
          </div>

          {/* Sidebar Stats */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-2xl border border-border shadow-sm p-8 sticky top-24"
            >
              <h3 className="text-xl font-bold font-serif mb-6 border-b border-border pb-4">
                {language === "ar" ? "تفاصيل المشروع" : "Project Details"}
              </h3>
              
              <div className="space-y-6">
                {project.type && (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-primary shrink-0">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{language === "ar" ? "النوع" : "Type"}</p>
                      <p className="font-bold text-foreground">{project.type}</p>
                    </div>
                  </div>
                )}
                
                {project.price && (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-primary shrink-0">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{language === "ar" ? "السعر يبدأ من" : "Starting Price"}</p>
                      <p className="font-bold text-foreground">{project.price}</p>
                    </div>
                  </div>
                )}
                
                {project.area && (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-primary shrink-0">
                      <Ruler className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{language === "ar" ? "المساحة" : "Area"}</p>
                      <p className="font-bold text-foreground">{project.area}</p>
                    </div>
                  </div>
                )}
                
                <div className="pt-6 mt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2 flex justify-between">
                    <span>{t.completion}</span>
                    <span className="font-bold text-primary">{project.completionPercentage || 0}%</span>
                  </p>
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-secondary h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${project.completionPercentage || 0}%` }}
                    />
                  </div>
                </div>

                <div className="pt-6 grid grid-cols-2 gap-4 text-center">
                  <div className="bg-muted rounded-xl p-4">
                    <p className="text-2xl font-bold text-primary mb-1">{project.totalUnits}</p>
                    <p className="text-xs text-muted-foreground">{t.totalUnits}</p>
                  </div>
                  <div className="bg-muted rounded-xl p-4">
                    <p className="text-2xl font-bold text-secondary mb-1">{project.availableUnits}</p>
                    <p className="text-xs text-muted-foreground">{t.availableUnits}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}