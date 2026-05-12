import { useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/constants";
import { useGetDashboardStats, useListProjects, useListServices, useListNews } from "@workspace/api-client-react";
import { motion, useAnimation, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Building2, Users, TrendingUp, ArrowRight, ArrowLeft, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
      
      // easeOutQuart
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(from + (to - from) * easeProgress);
      
      if (nodeRef.current) {
        nodeRef.current.textContent = current.toString();
      }

      if (progress < 1) {
        animationFrame = requestAnimationFrame(updateCounter);
      }
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
    document.title = `${t.home} | منصة نوى العقارية`;
  }, [t.home]);

  const { data: stats } = useGetDashboardStats({
    query: {
      queryKey: ["dashboardStats"]
    }
  });

  const { data: projects, isLoading: projectsLoading } = useListProjects({ featured: "true" }, {
    query: {
      queryKey: ["featuredProjects"]
    }
  });

  const { data: services, isLoading: servicesLoading } = useListServices({
    query: {
      queryKey: ["services"]
    }
  });

  const { data: news, isLoading: newsLoading } = useListNews({ featured: "true" }, {
    query: {
      queryKey: ["featuredNews"]
    }
  });

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-[100dvh] flex items-center justify-center overflow-hidden">
        <motion.div 
          className="absolute inset-0 z-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <img 
            src="/images/hero-1.png" 
            alt="Luxury Real Estate" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/50 to-transparent dark:from-primary/90 dark:via-primary/70" />
        </motion.div>

        <div className="container mx-auto px-4 relative z-10 text-white mt-16">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="max-w-3xl"
          >
            <h1 className="text-5xl md:text-7xl font-bold font-serif leading-tight mb-6">
              {t.heroTitle}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-10 leading-relaxed font-light">
              {t.heroSubtitle}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/projects">
                <Button size="lg" className="text-lg px-8 py-6 h-auto bg-secondary text-secondary-foreground hover:bg-white hover:text-primary transition-all duration-300">
                  {t.heroCTA}
                  {isRtl ? <ArrowLeft className="mr-2 h-5 w-5" /> : <ArrowRight className="ml-2 h-5 w-5" />}
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto bg-transparent border-white/30 text-white hover:bg-white hover:text-primary transition-all duration-300">
                  {t.contact}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
        >
          <span className="text-xs uppercase tracking-widest">{t.explore}</span>
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="w-[1px] h-12 bg-gradient-to-b from-white/70 to-transparent"
          />
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 divide-y md:divide-y-0 md:divide-x md:rtl:divide-x-reverse divide-white/20">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center py-6 md:py-0"
            >
              <Building2 className="w-12 h-12 mx-auto mb-6 text-secondary" />
              <div className="text-5xl font-bold font-serif mb-2 text-white flex justify-center items-baseline gap-1">
                +<Counter from={0} to={stats?.totalProjects || 45} />
              </div>
              <p className="text-white/70 text-lg uppercase tracking-wider">{t.statsProjects}</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center py-6 md:py-0"
            >
              <Users className="w-12 h-12 mx-auto mb-6 text-secondary" />
              <div className="text-5xl font-bold font-serif mb-2 text-white flex justify-center items-baseline gap-1">
                +<Counter from={0} to={stats?.totalBrokers || 120} />
              </div>
              <p className="text-white/70 text-lg uppercase tracking-wider">{t.statsBrokers}</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-center py-6 md:py-0"
            >
              <TrendingUp className="w-12 h-12 mx-auto mb-6 text-secondary" />
              <div className="text-5xl font-bold font-serif mb-2 text-white flex justify-center items-baseline gap-1">
                +<Counter from={0} to={15} />
              </div>
              <p className="text-white/70 text-lg uppercase tracking-wider">{t.statsExperience}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-sm font-bold text-secondary uppercase tracking-widest mb-2">Portfolio</h2>
              <h3 className="text-4xl font-serif font-bold text-foreground">{t.featuredProjects}</h3>
            </div>
            <Link href="/projects" className="hidden md:flex items-center text-primary font-medium hover:text-secondary transition-colors">
              {t.viewProject}
              {isRtl ? <ArrowLeft className="mr-2 h-4 w-4" /> : <ArrowRight className="ml-2 h-4 w-4" />}
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projectsLoading ? (
              Array(3).fill(0).map((_, i) => (
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
                    <div className="relative h-64 overflow-hidden">
                      <div className="absolute inset-0 bg-primary/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
                      <img 
                        src={project.imageUrl || "/images/project-1.png"} 
                        alt={language === "ar" ? project.titleAr : project.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute top-4 left-4 z-20">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold rounded-full text-primary uppercase tracking-wider">
                          {t[project.status as keyof typeof t] || project.status}
                        </span>
                      </div>
                    </div>
                    <div className="p-8">
                      <h4 className="text-xl font-bold font-serif mb-3 group-hover:text-primary transition-colors">
                        {language === "ar" ? project.titleAr : project.title}
                      </h4>
                      <p className="text-muted-foreground flex items-center gap-2 mb-6 text-sm">
                        <MapPin className="w-4 h-4" />
                        {language === "ar" ? project.locationAr : project.location}
                      </p>
                      
                      <div className="flex justify-between items-center pt-6 border-t border-border">
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
              <div className="col-span-full text-center py-20 text-muted-foreground">
                No featured projects available yet.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Lobby Image Break */}
      <section className="h-[60vh] relative flex items-center justify-center overflow-hidden">
        <motion.div 
          className="absolute inset-0"
          initial={{ y: -50 }}
          whileInView={{ y: 50 }}
          viewport={{ once: false }}
          transition={{ ease: "linear", duration: 2 }}
        >
          <img src="/images/hero-2.png" alt="Lobby" className="w-full h-[150%] object-cover object-center" />
        </motion.div>
        <div className="absolute inset-0 bg-primary/40 backdrop-blur-[2px]" />
        <div className="relative z-10 text-center text-white px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">Excellence in Every Detail</h2>
            <Link href="/about">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                {t.about}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
      
      {/* Add padding at bottom so scroll is noticeable */}
      <div className="h-24"></div>
    </div>
  );
}