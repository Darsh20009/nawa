import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { translations } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useGetSiteSettings } from "@workspace/api-client-react";
const logoPath = "/logo-transparent.png";
import { Menu, X, Globe, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

const SocialLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="w-7 h-7 rounded-full bg-white/15 hover:bg-secondary hover:text-primary flex items-center justify-center text-white text-xs font-bold transition-all duration-200"
  >
    {children}
  </a>
);

export function Navbar() {
  const [location] = useLocation();
  const { language, toggleLanguage, isRtl } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const t = translations[language];
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: settings } = useGetSiteSettings();

  const phone = settings?.phone || "+966500073509";
  const waPhone = (settings?.whatsapp || settings?.phone || "966500073509").replace(/\D/g, "");
  const email = settings?.email || "info@nawainv.sa";
  const phoneDisplay = phone.startsWith("+") ? phone : `+${phone}`;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { href: "/", label: t.home },
    { href: "/about", label: t.about },
    { href: "/services", label: t.services },
    { href: "/projects", label: t.projects },
    { href: "/board", label: t.board },
    { href: "/media", label: t.media },
    { href: "/careers", label: t.careers },
    { href: "/brokers", label: t.brokers },
    { href: "/contact", label: t.contact },
  ];

  const isHomePage = location === "/";

  return (
    <>
      {/* Top Bar — only visible on transparent (hero) state */}
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          isScrolled ? "opacity-0 pointer-events-none -translate-y-full" : "opacity-100 translate-y-0"
        )}
      >
        <div className="bg-primary/60 backdrop-blur-sm border-b border-white/10">
          <div className="container mx-auto px-4 md:px-6 h-9 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-white/80 hover:text-secondary transition-colors text-xs font-medium">
                <Phone className="w-3 h-3" />
                <span dir="ltr">{phoneDisplay}</span>
              </a>
              <a href={`mailto:${email}`}
                className="text-white/80 hover:text-secondary transition-colors text-xs font-medium hidden sm:block">
                {email}
              </a>
            </div>
            <div className="flex items-center gap-2">
              {(settings?.instagram || "https://instagram.com/nawainv") && (
                <SocialLink href={settings?.instagram || "https://instagram.com/nawainv"}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </SocialLink>
              )}
              {(settings?.twitter || "https://x.com/nawainv") && (
                <SocialLink href={settings?.twitter || "https://x.com/nawainv"}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </SocialLink>
              )}
              {(settings?.linkedin || "https://linkedin.com/company/nawainv") && (
                <SocialLink href={settings?.linkedin || "https://linkedin.com/company/nawainv"}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </SocialLink>
              )}
              <div className="w-px h-4 bg-white/20 mx-1" />
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 text-white/80 hover:text-secondary transition-colors text-xs font-bold"
              >
                <Globe className="w-3 h-3" />
                {language === "ar" ? "EN" : "عر"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header
        className={cn(
          "fixed left-0 right-0 z-50 transition-all duration-500 ease-in-out",
          isScrolled ? "top-0" : "top-9"
        )}
      >
        <div
          className={cn(
            "transition-all duration-500",
            isScrolled
              ? "bg-white shadow-lg border-b border-gray-100 py-3"
              : "bg-transparent py-4"
          )}
        >
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center z-50 shrink-0">
                <img
                  src={logoPath}
                  alt="Nawa Real Estate"
                  className={cn(
                    "transition-all duration-300 object-contain",
                    isScrolled ? "h-9" : "h-12",
                    !isScrolled && "brightness-0 invert"
                  )}
                />
              </Link>

              {/* Desktop Nav */}
              <nav className="hidden lg:flex items-center gap-1">
                {links.map((link) => {
                  const isActive = location === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "relative px-3 py-2 text-sm font-medium transition-all duration-200 rounded-md group",
                        isActive
                          ? isScrolled ? "text-primary" : "text-secondary"
                          : isScrolled
                          ? "text-gray-700 hover:text-primary"
                          : "text-white/90 hover:text-white"
                      )}
                    >
                      {link.label}
                      <span
                        className={cn(
                          "absolute bottom-0.5 left-3 right-3 h-0.5 rounded-full transition-all duration-300",
                          isActive
                            ? "bg-secondary opacity-100 scale-x-100"
                            : "bg-secondary opacity-0 scale-x-0 group-hover:opacity-70 group-hover:scale-x-100"
                        )}
                      />
                    </Link>
                  );
                })}
              </nav>

              {/* Right Actions */}
              <div className="hidden lg:flex items-center gap-3">
                {isScrolled && (
                  <button
                    onClick={toggleLanguage}
                    className="flex items-center gap-1.5 text-sm font-bold text-gray-600 hover:text-primary transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    {language === "ar" ? "EN" : "عر"}
                  </button>
                )}

                {isAuthenticated ? (
                  <Link href={user?.role.includes("admin") ? "/admin" : "/employee"}>
                    <Button
                      size="sm"
                      className={cn(
                        "gap-2 text-sm transition-all",
                        isScrolled
                          ? "bg-primary text-white hover:bg-primary/90"
                          : "bg-secondary text-primary hover:bg-secondary/90"
                      )}
                    >
                      <User className="w-3.5 h-3.5" />
                      {user?.role.includes("admin") ? t.adminPortal : t.employeePortal}
                    </Button>
                  </Link>
                ) : (
                  <Link href="/auth/login">
                    <Button
                      size="sm"
                      className={cn(
                        "text-sm font-semibold transition-all",
                        isScrolled
                          ? "bg-primary text-white hover:bg-primary/90"
                          : "bg-secondary text-primary hover:bg-secondary/90"
                      )}
                    >
                      {t.login}
                    </Button>
                  </Link>
                )}
              </div>

              {/* Mobile Toggle */}
              <button
                className={cn(
                  "lg:hidden z-50 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                  mobileMenuOpen
                    ? "bg-primary text-white"
                    : isScrolled
                    ? "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    : "bg-white/15 text-white hover:bg-white/25"
                )}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Gold accent line */}
        <div className={cn(
          "h-[2px] bg-gradient-to-r from-transparent via-secondary to-transparent transition-opacity duration-500",
          isScrolled ? "opacity-100" : "opacity-0"
        )} />
      </header>

      {/* Mobile Menu */}
      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden transition-all duration-400 ease-in-out",
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="absolute inset-0 bg-primary/95 backdrop-blur-md" />
        <div className={cn(
          "relative h-full flex flex-col pt-28 px-8 pb-8 transition-all duration-400",
          mobileMenuOpen ? "translate-y-0" : "-translate-y-4"
        )}>
          <nav className="flex flex-col gap-1 flex-1">
            {links.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-xl font-semibold py-4 border-b border-white/10 flex items-center justify-between transition-all duration-200",
                  location === link.href ? "text-secondary" : "text-white/90 hover:text-secondary"
                )}
                style={{ transitionDelay: `${i * 30}ms` }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
                <span className="text-white/30 text-sm">←</span>
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-6 space-y-4">
            <button
              onClick={() => { toggleLanguage(); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 text-white/70 hover:text-white py-2"
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium">{language === "ar" ? "English" : "العربية"}</span>
            </button>

            {/* AI Chat trigger — opens the floating widget */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setTimeout(() => window.dispatchEvent(new CustomEvent("nawa:open-ai-chat")), 250);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-secondary/20 to-secondary/10 hover:from-secondary/30 hover:to-secondary/20 border border-secondary/30 text-white transition-all"
            >
              <svg className="w-4 h-4 text-secondary" viewBox="0 0 24 24" fill="currentColor"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>
              <span className="text-sm font-bold">{language === "ar" ? "اسأل نوى مي ✨" : "Ask Nawa Me ✨"}</span>
            </button>

            {isAuthenticated ? (
              <Link
                href={user?.role.includes("admin") ? "/admin" : "/employee"}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button className="w-full bg-secondary text-primary hover:bg-secondary/90 font-bold" size="lg">
                  {user?.role.includes("admin") ? t.adminPortal : t.employeePortal}
                </Button>
              </Link>
            ) : (
              <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-secondary text-primary hover:bg-secondary/90 font-bold" size="lg">
                  {t.login}
                </Button>
              </Link>
            )}
            <div className="flex gap-3 pt-2">
              <a href="https://instagram.com/nawainv" target="_blank" rel="noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-secondary hover:text-primary flex items-center justify-center text-white text-xs transition-all">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="https://x.com/nawainv" target="_blank" rel="noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-secondary hover:text-primary flex items-center justify-center text-white text-xs transition-all">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://linkedin.com/company/nawainv" target="_blank" rel="noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-secondary hover:text-primary flex items-center justify-center text-white text-xs transition-all">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
