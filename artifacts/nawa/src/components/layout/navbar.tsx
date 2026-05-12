import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { translations } from "@/lib/constants";
import { cn } from "@/lib/utils";
import logoPath from "@assets/Screenshot_2026-05-12_at_1.51.13_PM_1778583134608.png";
import { Menu, X, Globe, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [location] = useLocation();
  const { language, toggleLanguage, isRtl } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const t = translations[language];
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
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

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
        isScrolled 
          ? "bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm py-2" 
          : "bg-transparent py-4"
      )}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center z-50">
            <img 
              src={logoPath} 
              alt="Nawa Real Estate" 
              className={cn("h-10 transition-all duration-300", isScrolled ? "h-8" : "")} 
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center space-x-6 rtl:space-x-reverse">
            {links.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  location === link.href 
                    ? "text-primary" 
                    : isScrolled ? "text-foreground" : "text-white"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center space-x-4 rtl:space-x-reverse">
            <button 
              onClick={toggleLanguage}
              className={cn(
                "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                isScrolled ? "text-foreground" : "text-white"
              )}
            >
              <Globe className="w-4 h-4" />
              <span>{language === "ar" ? "EN" : "AR"}</span>
            </button>
            
            {isAuthenticated ? (
              <Link href={user?.role.includes("admin") ? "/admin" : "/employee"}>
                <Button variant={isScrolled ? "default" : "secondary"} className="gap-2">
                  <User className="w-4 h-4" />
                  {user?.role.includes("admin") ? t.adminPortal : t.employeePortal}
                </Button>
              </Link>
            ) : (
              <Link href="/auth/login">
                <Button variant={isScrolled ? "default" : "secondary"}>
                  {t.login}
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button 
            className="lg:hidden z-50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className={cn("w-6 h-6", isScrolled || mobileMenuOpen ? "text-foreground" : "text-white")} />
            ) : (
              <Menu className={cn("w-6 h-6", isScrolled ? "text-foreground" : "text-white")} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div 
        className={cn(
          "fixed inset-0 bg-white z-40 transition-transform duration-300 ease-in-out lg:hidden pt-24 px-6",
          mobileMenuOpen ? "translate-x-0" : isRtl ? "translate-x-full" : "-translate-x-full"
        )}
      >
        <nav className="flex flex-col space-y-6">
          {links.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className={cn(
                "text-2xl font-bold transition-colors hover:text-primary border-b border-gray-100 pb-4",
                location === link.href ? "text-primary" : "text-foreground"
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          
          <div className="pt-4 flex flex-col space-y-4">
            <button 
              onClick={() => {
                toggleLanguage();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 text-lg font-medium text-foreground py-2"
            >
              <Globe className="w-5 h-5" />
              <span>{language === "ar" ? "English" : "العربية"}</span>
            </button>
            
            {isAuthenticated ? (
              <Link href={user?.role.includes("admin") ? "/admin" : "/employee"} onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full justify-start gap-2" size="lg">
                  <User className="w-5 h-5" />
                  {user?.role.includes("admin") ? t.adminPortal : t.employeePortal}
                </Button>
              </Link>
            ) : (
              <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full" size="lg">
                  {t.login}
                </Button>
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}