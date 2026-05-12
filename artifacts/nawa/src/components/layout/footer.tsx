import { Link } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/constants";
import { useGetSiteSettings } from "@workspace/api-client-react";
import { Mail, Phone } from "lucide-react";
const logoPath = "/logo-transparent.png";

const DEFAULT_PHONE = "+966500073509";
const DEFAULT_WHATSAPP = "+966500073509";
const DEFAULT_EMAIL = "info@nawainv.sa";

const socialIcons: Record<string, React.ReactNode> = {
  instagram: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  ),
  twitter: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  facebook: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  linkedin: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  youtube: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  tiktok: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  ),
  snapchat: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.065.494C8.927.494 6.11 1.98 4.236 4.254c-1.11 1.373-1.73 2.97-1.73 4.764 0 .48.04.952.104 1.41-.23.12-.504.19-.8.19-.36 0-.71-.11-1.01-.3-.18-.12-.38-.19-.58-.19-.44 0-.82.35-.82.79 0 .35.21.65.54.79.58.24 1.5.44 2.25.51.33.98 1.03 1.89 2.01 2.6l-.01.01c-.35.56-1.03 1.01-1.96 1.2-.38.08-.63.46-.55.84.08.38.46.63.84.55 1.36-.28 2.38-.93 3.01-1.84.37.07.75.11 1.13.11.91 0 1.76-.21 2.49-.57.73.36 1.58.57 2.49.57.38 0 .76-.04 1.13-.11.63.91 1.65 1.56 3.01 1.84.38.08.76-.17.84-.55.08-.38-.17-.76-.55-.84-.93-.19-1.61-.64-1.96-1.2l-.01-.01c.98-.71 1.68-1.62 2.01-2.6.75-.07 1.67-.27 2.25-.51.33-.14.54-.44.54-.79 0-.44-.38-.79-.82-.79-.2 0-.4.07-.58.19-.3.19-.65.3-1.01.3-.3 0-.57-.07-.8-.19.064-.458.104-.93.104-1.41 0-1.794-.62-3.391-1.73-4.764C17.955 1.98 15.138.494 12 .494z"/>
    </svg>
  ),
  whatsapp: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
};

export function Footer() {
  const { language } = useLanguage();
  const t = translations[language];
  const { data: settings } = useGetSiteSettings();

  const phone = settings?.phone || DEFAULT_PHONE;
  const whatsapp = settings?.whatsapp || DEFAULT_WHATSAPP;
  const email = settings?.email || DEFAULT_EMAIL;
  const footerText = language === "ar"
    ? (settings?.footerText || "نوى للاستثمار العقاري — شريكك الأمثل في بناء ثروتك العقارية بالمملكة العربية السعودية.")
    : (settings?.footerTextEn || "Nawa Real Estate Investment — your ideal partner in building your real estate wealth in Saudi Arabia.");

  const socialLinks = [
    { key: "instagram", href: settings?.instagram || "https://instagram.com/nawainv", label: "Instagram" },
    { key: "twitter", href: settings?.twitter || "https://x.com/nawainv", label: "X" },
    { key: "linkedin", href: settings?.linkedin || "https://linkedin.com/company/nawainv", label: "LinkedIn" },
    { key: "facebook", href: settings?.facebook || "", label: "Facebook" },
    { key: "youtube", href: settings?.youtube || "", label: "YouTube" },
    { key: "tiktok", href: settings?.tiktok || "", label: "TikTok" },
    { key: "snapchat", href: settings?.snapchat || "", label: "Snapchat" },
    { key: "whatsapp", href: `https://wa.me/${(whatsapp || DEFAULT_WHATSAPP).replace(/\D/g, "")}`, label: "WhatsApp" },
  ].filter(s => s.href && s.href.startsWith("http"));

  const phoneFormatted = phone.startsWith("+") ? phone : `+${phone}`;
  const waNumber = (whatsapp || DEFAULT_WHATSAPP).replace(/\D/g, "");

  return (
    <footer className="bg-[#0a1428] text-white">
      <div className="h-1 bg-gradient-to-r from-transparent via-secondary to-transparent" />

      <div className="container mx-auto px-4 md:px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 mb-14">

          {/* Brand — 4 cols */}
          <div className="lg:col-span-4 space-y-6">
            <img src={logoPath} alt="Nawa" className="h-14 brightness-0 invert opacity-95" />
            <p className="text-white/60 leading-relaxed text-sm max-w-xs">
              {footerText}
            </p>
            <div className="flex flex-wrap gap-2.5">
              {socialLinks.map((s) => (
                <a
                  key={s.key}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="w-10 h-10 rounded-xl bg-white/8 hover:bg-secondary hover:text-primary border border-white/10 hover:border-secondary flex items-center justify-center text-white/70 transition-all duration-200"
                >
                  {socialIcons[s.key]}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links — 2 cols */}
          <div className="lg:col-span-2">
            <h3 className="text-secondary font-bold text-sm uppercase tracking-widest mb-6">
              {language === "ar" ? "روابط سريعة" : "Quick Links"}
            </h3>
            <ul className="space-y-3">
              {[
                { href: "/about", label: t.about },
                { href: "/services", label: t.services },
                { href: "/projects", label: t.projects },
                { href: "/board", label: t.board },
                { href: "/careers", label: t.careers },
                { href: "/contact", label: t.contact },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/55 hover:text-secondary transition-colors text-sm flex items-center gap-2 group">
                    <span className="w-3 h-px bg-secondary/40 group-hover:w-5 transition-all duration-200" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services — 2 cols */}
          <div className="lg:col-span-2">
            <h3 className="text-secondary font-bold text-sm uppercase tracking-widest mb-6">
              {language === "ar" ? "خدماتنا" : "Services"}
            </h3>
            <ul className="space-y-3">
              {(language === "ar"
                ? ["تطوير عقاري", "إدارة أصول", "استشارات استثمارية", "تمويل عقاري", "مشاريع سكنية", "مشاريع تجارية"]
                : ["Real Estate Dev.", "Asset Management", "Investment Advisory", "Real Estate Finance", "Residential Projects", "Commercial Projects"]
              ).map((item) => (
                <li key={item} className="text-white/55 text-sm flex items-center gap-2 group">
                  <span className="w-3 h-px bg-secondary/40 group-hover:w-5 transition-all duration-200" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact — 4 cols */}
          <div className="lg:col-span-4">
            <h3 className="text-secondary font-bold text-sm uppercase tracking-widest mb-6">
              {t.contactInfo}
            </h3>
            <div className="space-y-4">
              {phone && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-secondary" />
                  </div>
                  <a
                    href={`tel:${phone}`}
                    className="text-white/60 hover:text-secondary transition-colors text-sm"
                    dir="ltr"
                  >
                    {phoneFormatted}
                  </a>
                </div>
              )}
              {email && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-secondary" />
                  </div>
                  <a
                    href={`mailto:${email}`}
                    className="text-white/60 hover:text-secondary transition-colors text-sm"
                  >
                    {email}
                  </a>
                </div>
              )}

              {/* WhatsApp CTA */}
              {waNumber && (
                <a
                  href={`https://wa.me/${waNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 flex items-center gap-3 bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 w-fit"
                >
                  {socialIcons.whatsapp}
                  {language === "ar" ? "تواصل عبر واتساب" : "Chat on WhatsApp"}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-white/35 text-xs">
            © {new Date().getFullYear()} {language === "ar" ? "نوى للاستثمار العقاري. جميع الحقوق محفوظة." : "Nawa Real Estate Investment. All rights reserved."}
          </p>
          <div className="flex items-center gap-4 text-xs text-white/35">
            <Link href="/privacy" className="hover:text-secondary transition-colors">
              {language === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}
            </Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-secondary transition-colors">
              {language === "ar" ? "الشروط والأحكام" : "Terms"}
            </Link>
            <span>·</span>
            <a href="https://qiroxstudio.online" target="_blank" rel="noreferrer" className="hover:text-secondary transition-colors">
              {language === "ar" ? "تصميم Qirox Studio" : "Built by Qirox Studio"}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
