import { useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/constants";
import { useGetDashboardStats, useListProjects, useListServices, useListNews } from "@workspace/api-client-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Building2, Users, TrendingUp, ArrowRight, ArrowLeft, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { HeroVideo } from "@/components/shared/hero-video";

function Counter({ from, to, duration = 2 }: { from: number; to: number; duration?: number }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(nodeRef, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;
    let startTime: number;
    let animationFrame: number;
    const updateCounter = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(from + (to - from) * easeProgress);
      if (nodeRef.current) nodeRef.current.textContent = current.toString();
      if (progress < 1) animationFrame = requestAnimationFrame(updateCounter);
    };
    animationFrame = requestAnimationFrame(updateCounter);
    return () => cancelAnimationFrame(animationFrame);
  }, [from, to, duration, isInView]);

  return <span ref={nodeRef}>{from}</span>;
}

export default function Home() {
  const { language, isRtl } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    document.title = `${t.home} | نوى العقارية`;
  }, [t.home]);

  const { data: stats } = useGetDashboardStats({ query: { queryKey: ["dashboardStats"] } });
  const { data: projects, isLoading: projectsLoading } = useListProjects({ featured: "true" }, { query: { queryKey: ["featuredProjects"] } });
  const { data: services, isLoading: servicesLoading } = useListServices({ query: { queryKey: ["services"] } });
  const { data: news, isLoading: newsLoading } = useListNews({ featured: "true" }, { query: { queryKey: ["featuredNews"] } });

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-[100dvh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <HeroVideo className="w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-primary/85 via-primary/60 to-primary/30 md:to-primary/10" />
        </div>

        <div className="container mx-auto px-5 md:px-6 relative z-10 text-white mt-20 md:mt-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="max-w-2xl"
          >
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-serif leading-tight mb-4 md:mb-6">
              {t.heroTitle}
            </h1>
            <p className="text-base sm:text-lg md:text-2xl text-white/90 mb-6 md:mb-10 leading-relaxed font-light">
              {t.heroSubtitle}
            </p>
            <div className="flex flex-wrap gap-3 md:gap-4">
              <Link href="/projects">
                <Button size="lg" className="text-sm md:text-base px-5 md:px-8 py-4 md:py-6 h-auto bg-secondary text-secondary-foreground hover:bg-white hover:text-primary transition-all duration-300">
                  {t.heroCTA}
                  {isRtl ? <ArrowLeft className="mr-2 h-4 w-4" /> : <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="text-sm md:text-base px-5 md:px-8 py-4 md:py-6 h-auto bg-transparent border-white/50 text-white hover:bg-white hover:text-primary transition-all duration-300">
                  {t.contact}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator - hidden on small screens */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 text-white/70 hidden sm:flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
        >
          <span className="text-xs uppercase tracking-widest">{t.explore}</span>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="w-[1px] h-10 bg-gradient-to-b from-white/70 to-transparent"
          />
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-14 md:py-20 bg-primary text-white">
        <div className="container mx-auto px-5 md:px-6">
          <div className="grid grid-cols-3 gap-4 md:gap-12 divide-x md:divide-x rtl:divide-x-reverse divide-white/20">
            {[
              { icon: Building2, value: stats?.totalProjects || 45, label: t.statsProjects },
              { icon: Users, value: stats?.totalBrokers || 120, label: t.statsBrokers },
              { icon: TrendingUp, value: 15, label: t.statsExperience },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="text-center px-2 md:px-0"
                >
                  <Icon className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-3 md:mb-6 text-secondary" />
                  <div className="text-3xl md:text-5xl font-bold font-serif mb-1 md:mb-2 text-white flex justify-center items-baseline gap-0.5">
                    +<Counter from={0} to={stat.value} />
                  </div>
                  <p className="text-white/70 text-xs md:text-lg uppercase tracking-wider leading-tight">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-5 md:px-6">
          <div className="flex justify-between items-end mb-10 md:mb-16">
            <div>
              <h2 className="text-xs md:text-sm font-bold text-secondary uppercase tracking-widest mb-1 md:mb-2">Portfolio</h2>
              <h3 className="text-2xl md:text-4xl font-serif font-bold text-foreground">{t.featuredProjects}</h3>
            </div>
            <Link href="/projects" className="flex items-center text-primary text-sm font-medium hover:text-secondary transition-colors">
              {t.viewProject}
              {isRtl ? <ArrowLeft className="mr-1 h-4 w-4" /> : <ArrowRight className="ml-1 h-4 w-4" />}
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
            {projectsLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden bg-white shadow-sm border border-border">
                  <Skeleton className="h-52 w-full" />
                  <div className="p-5">
                    <Skeleton className="h-6 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))
            ) : Array.isArray(projects) && projects.length > 0 ? (
              projects.slice(0, 3).map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group rounded-xl overflow-hidden bg-white shadow-sm border border-border hover:shadow-xl transition-all duration-300"
                >
                  <Link href={`/projects/${project.id}`}>
                    <div className="relative h-52 md:h-64 overflow-hidden">
                      <div className="absolute inset-0 bg-primary/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
                      <img
                        src={project.imageUrl || "/images/project-1.png"}
                        alt={language === "ar" ? project.titleAr : project.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute top-3 start-3 z-20">
                        <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold rounded-full text-primary uppercase tracking-wider">
                          {t[project.status as keyof typeof t] || project.status}
                        </span>
                      </div>
                    </div>
                    <div className="p-5 md:p-8">
                      <h4 className="text-lg md:text-xl font-bold font-serif mb-2 md:mb-3 group-hover:text-primary transition-colors">
                        {language === "ar" ? project.titleAr : project.title}
                      </h4>
                      <p className="text-muted-foreground flex items-center gap-2 mb-4 md:mb-6 text-sm">
                        <MapPin className="w-4 h-4 shrink-0" />
                        {language === "ar" ? project.locationAr : project.location}
                      </p>
                      <div className="flex justify-between items-center pt-4 md:pt-6 border-t border-border">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{t.completion}</p>
                          <p className="font-bold text-foreground">{project.completionPercentage}%</p>
                        </div>
                        <div className="w-px h-8 bg-border" />
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{t.availableUnits}</p>
                          <p className="font-bold text-foreground">{project.availableUnits} / {project.totalUnits}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-16 text-muted-foreground">
                {language === "ar" ? "لا توجد مشاريع مميزة حالياً" : "No featured projects available yet."}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Services Section */}
      {Array.isArray(services) && services.length > 0 && (
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-5 md:px-6">
            <div className="text-center mb-10 md:mb-16">
              <h2 className="text-xs md:text-sm font-bold text-secondary uppercase tracking-widest mb-1 md:mb-2">Services</h2>
              <h3 className="text-2xl md:text-4xl font-serif font-bold text-foreground">{t.services}</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
              {Array.isArray(services) && services.slice(0, 6).map((service, i) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-muted/30 rounded-xl p-4 md:p-8 text-center hover:shadow-md transition-all duration-300 border border-border"
                >
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-5">
                    <Building2 className="w-5 h-5 md:w-7 md:h-7 text-primary" />
                  </div>
                  <h4 className="text-sm md:text-lg font-bold mb-1 md:mb-3 text-foreground">
                    {language === "ar" ? service.titleAr : service.title}
                  </h4>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed hidden md:block">
                    {language === "ar" ? service.descriptionAr : service.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Video Break Banner */}
      <section className="h-[40vh] md:h-[60vh] relative flex items-center justify-center overflow-hidden">
        <HeroVideo />
        <div className="absolute inset-0 bg-primary/50 backdrop-blur-[1px]" />
        <div className="relative z-10 text-center text-white px-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <p className="text-secondary uppercase tracking-widest text-xs md:text-sm font-bold mb-3 md:mb-4">
              {language === "ar" ? "نوى للاستثمار العقاري" : "Nawa Real Estate Investment"}
            </p>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold mb-4 md:mb-6">
              {language === "ar" ? "التميز في كل تفصيل" : "Excellence in Every Detail"}
            </h2>
            <Link href="/about">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary text-sm md:text-base">
                {t.about}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* News Section */}
      {Array.isArray(news) && news.length > 0 && (
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-5 md:px-6">
            <div className="flex justify-between items-end mb-10 md:mb-16">
              <div>
                <h2 className="text-xs md:text-sm font-bold text-secondary uppercase tracking-widest mb-1 md:mb-2">Media</h2>
                <h3 className="text-2xl md:text-4xl font-serif font-bold text-foreground">{t.media}</h3>
              </div>
              <Link href="/media" className="flex items-center text-primary text-sm font-medium hover:text-secondary transition-colors">
                {language === "ar" ? "الكل" : "All"}
                {isRtl ? <ArrowLeft className="mr-1 h-4 w-4" /> : <ArrowRight className="ml-1 h-4 w-4" />}
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
              {news.slice(0, 3).map((article, i) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group rounded-xl overflow-hidden bg-white shadow-sm border border-border hover:shadow-xl transition-all duration-300"
                >
                  <Link href={`/media/${article.id}`}>
                    <div className="relative h-44 md:h-56 overflow-hidden">
                      <img
                        src={article.imageUrl || "/images/news-1.png"}
                        alt={language === "ar" ? article.titleAr : article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                    <div className="p-4 md:p-6">
                      <h4 className="text-base md:text-lg font-bold font-serif mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {language === "ar" ? article.titleAr : article.title}
                      </h4>
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                        {language === "ar" ? article.contentAr : article.content}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="h-8 md:h-16"></div>
    </div>
  );
}
