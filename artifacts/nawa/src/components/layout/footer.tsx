import { Link } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/constants";
import logoPath from "@assets/Screenshot_2026-05-12_at_1.51.13_PM_1778583134608.png";
import { Mail, Phone, MapPin, Linkedin, Twitter, Instagram } from "lucide-react";

export function Footer() {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <footer className="bg-primary text-primary-foreground pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-6">
            <div className="bg-white/10 p-4 rounded-xl inline-block">
              <img src={logoPath} alt="Nawa" className="h-10 brightness-0 invert" />
            </div>
            <p className="text-primary-foreground/80 leading-relaxed font-serif">
              {t.tagline}
            </p>
            <div className="flex space-x-4 rtl:space-x-reverse">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-secondary hover:text-secondary-foreground transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-secondary hover:text-secondary-foreground transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-secondary hover:text-secondary-foreground transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-6 font-serif text-secondary">{t.quickLinks}</h3>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-primary-foreground/80 hover:text-secondary transition-colors">{t.about}</Link></li>
              <li><Link href="/services" className="text-primary-foreground/80 hover:text-secondary transition-colors">{t.services}</Link></li>
              <li><Link href="/projects" className="text-primary-foreground/80 hover:text-secondary transition-colors">{t.projects}</Link></li>
              <li><Link href="/careers" className="text-primary-foreground/80 hover:text-secondary transition-colors">{t.careers}</Link></li>
              <li><Link href="/contact" className="text-primary-foreground/80 hover:text-secondary transition-colors">{t.contact}</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-bold mb-6 font-serif text-secondary">{t.contactInfo}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3 rtl:space-x-reverse">
                <MapPin className="w-5 h-5 text-secondary mt-1 shrink-0" />
                <p className="text-primary-foreground/80">
                  {language === "ar" 
                    ? "طريق الملك فهد، العليا، الرياض 12214، المملكة العربية السعودية"
                    : "King Fahd Road, Olaya, Riyadh 12214, Saudi Arabia"}
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <Phone className="w-5 h-5 text-secondary shrink-0" />
                  <a href="tel:+966112345678" className="text-primary-foreground/80 hover:text-secondary transition-colors" dir="ltr">+966 11 234 5678</a>
                </div>
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <Mail className="w-5 h-5 text-secondary shrink-0" />
                  <a href="mailto:info@nawainv.sa" className="text-primary-foreground/80 hover:text-secondary transition-colors">info@nawainv.sa</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-primary-foreground/60 text-sm">
            {t.rights}
          </p>
          <div className="flex items-center gap-4 text-sm text-primary-foreground/60">
            <Link href="/privacy" className="hover:text-secondary transition-colors">
              {language === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-secondary transition-colors">
              {language === "ar" ? "الشروط والأحكام" : "Terms & Conditions"}
            </Link>
          </div>
          <p className="text-primary-foreground/60 text-sm">
            {t.builtBy} <a href="https://qiroxstudio.online" target="_blank" rel="noreferrer" className="text-secondary hover:underline font-semibold">Qirox Studio</a>
          </p>
        </div>
      </div>
    </footer>
  );
}