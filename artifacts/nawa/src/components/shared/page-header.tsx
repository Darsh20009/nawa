import { motion } from "framer-motion";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  overlayStrength?: "light" | "medium" | "dark";
}

export function PageHeader({ eyebrow, title, subtitle, overlayStrength = "medium" }: PageHeaderProps) {
  const overlay = {
    light: "from-primary/60 via-primary/45 to-primary/60",
    medium: "from-primary/80 via-primary/65 to-primary/80",
    dark: "from-primary/90 via-primary/80 to-primary/90",
  }[overlayStrength];

  return (
    <div className="relative h-[38vh] md:h-[46vh] flex items-end overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/nawa-hero.mov" type="video/mp4" />
      </video>
      <div className={`absolute inset-0 bg-gradient-to-b ${overlay}`} />

      {/* Gold shimmer bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-secondary to-transparent" />

      <div className="relative z-10 w-full container mx-auto px-4 md:px-6 pb-10 md:pb-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        >
          {eyebrow && (
            <p className="text-secondary uppercase tracking-[0.2em] text-xs font-bold mb-3">
              {eyebrow}
            </p>
          )}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold font-serif text-white leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 text-white/75 text-sm md:text-base max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
