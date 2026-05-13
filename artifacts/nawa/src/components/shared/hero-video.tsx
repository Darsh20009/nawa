import { memo, useEffect, useRef, useState } from "react";

interface HeroVideoProps {
  className?: string;
  poster?: string;
  /**
   * - "eager": load immediately (use only for above-the-fold home hero — exactly ONE per page)
   * - "lazy": defer until in viewport via IntersectionObserver (default — used for all secondary banners)
   */
  loading?: "eager" | "lazy";
}

export const HeroVideo = memo(function HeroVideo({
  className = "absolute inset-0 w-full h-full object-cover",
  poster = "/nawa-hero-poster.jpg",
  loading = "lazy",
}: HeroVideoProps) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(loading === "eager");

  useEffect(() => {
    if (loading === "eager" || shouldLoad) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldLoad(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loading, shouldLoad]);

  return (
    <video
      ref={ref}
      autoPlay
      muted
      loop
      playsInline
      preload={loading === "eager" ? "auto" : "metadata"}
      poster={poster}
      disablePictureInPicture
      disableRemotePlayback
      aria-hidden="true"
      className={className}
      onLoadedData={(e) => {
        // Force play as soon as first frame is ready (mobile autoplay safeguard)
        const v = e.currentTarget;
        v.play().catch(() => {});
      }}
    >
      {shouldLoad && (
        <>
          <source media="(max-width: 768px)" src="/nawa-hero-mobile.mp4" type="video/mp4" />
          <source src="/nawa-hero.webm" type="video/webm" />
          <source src="/nawa-hero.mp4" type="video/mp4" />
        </>
      )}
    </video>
  );
});
