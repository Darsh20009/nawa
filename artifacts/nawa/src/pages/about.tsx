import { useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/constants";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Shield, Lightbulb, Award, Users } from "lucide-react";

const values = {
  ar: [
    { icon: Shield, title: "الشفافية", desc: "وضوح تام في كافة التعاملات والتفاصيل المالية." },
    { icon: Lightbulb, title: "الابتكار", desc: "توظيف أحدث التقنيات لخدمة القطاع العقاري." },
    { icon: Award, title: "الجودة", desc: "التزام لا يتزعزع بأعلى المعايير في مشاريعنا وخدماتنا." },
    { icon: Users, title: "الموثوقية", desc: "بناء ثقة مستدامة مع شركائنا وعملائنا." },
  ],
  en: [
    { icon: Shield, title: "Transparency", desc: "Complete clarity in all transactions and financial details." },
    { icon: Lightbulb, title: "Innovation", desc: "Utilizing the latest technologies to serve the real estate sector." },
    { icon: Award, title: "Quality", desc: "Unwavering commitment to the highest standards in our projects." },
    { icon: Users, title: "Reliability", desc: "Building sustainable trust with our partners and clients." },
  ],
};

export default function About() {
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    document.title = `${t.about} | نوى العقارية`;
  }, [t.about]);

  const vals = values[language];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        eyebrow={language === "ar" ? "نوى العقارية" : "Nawa Real Estate"}
        title={language === "ar" ? "من نحن" : "About Us"}
        subtitle={
          language === "ar"
            ? "شركة استثمار عقاري رائدة مبنية على رؤية 2030 وقيم الشفافية والتميز"
            : "A leading real estate investment platform built on Vision 2030 and the values of transparency and excellence"
        }
      />

      <div className="container mx-auto px-4 md:px-6 py-16 md:py-24">
        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center mb-16 md:mb-24"
        >
          <p className="text-lg md:text-xl leading-relaxed text-muted-foreground">
            {language === "ar"
              ? "نحن في نوى العقارية نؤمن بأن العقار ليس مجرد مساحة، بل هو أصل ينمو ومستقبل يُبنى. انطلقنا من المملكة العربية السعودية برؤية طموحة تواكب تطلعات رؤية 2030، لنقدم حلاً متكاملاً في عالم الاستثمار العقاري."
              : "At Nawa Real Estate Platform, we believe that real estate is not just a space, but an asset that grows and a future that is built. We launched from Saudi Arabia with an ambitious vision aligned with Vision 2030."}
          </p>
        </motion.div>

        {/* Vision & Mission */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-16 md:mb-24 max-w-5xl mx-auto">
          {[
            {
              tag: language === "ar" ? "رؤيتنا" : "Our Vision",
              text: language === "ar"
                ? "أن نكون الشركة الرائدة والأكثر موثوقية في تقديم الفرص الاستثمارية العقارية المبتكرة في الشرق الأوسط، بمعايير عالمية ولمسة محلية أصيلة."
                : "To be the leading and most trusted platform for innovative real estate investment in the Middle East, with global standards and an authentic local touch.",
              bg: "bg-primary text-white",
              tagColor: "text-secondary",
            },
            {
              tag: language === "ar" ? "رسالتنا" : "Our Mission",
              text: language === "ar"
                ? "تمكين المستثمرين من الوصول إلى أفضل المشاريع العقارية بذكاء وشفافية، وتقديم خدمات متكاملة تضمن أعلى العوائد وأفضل التجارب."
                : "Empowering investors to access the best real estate projects intelligently and transparently, providing integrated services that ensure the highest returns.",
              bg: "bg-secondary/10 border border-secondary/20",
              tagColor: "text-primary",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className={`${item.bg} rounded-2xl p-8 md:p-10`}
            >
              <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${item.tagColor}`}>{item.tag}</p>
              <p className={`leading-relaxed text-base ${item.bg.includes("primary text") ? "text-white/85" : "text-foreground"}`}>
                {item.text}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Values */}
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-secondary uppercase tracking-widest text-xs font-bold mb-2">DNA</p>
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground">
              {language === "ar" ? "قيمنا الأساسية" : "Our Core Values"}
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {vals.map((val, i) => {
              const Icon = val.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white border border-border rounded-2xl p-6 text-center hover:shadow-lg hover:border-secondary/30 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/5 group-hover:bg-primary text-primary group-hover:text-white flex items-center justify-center mx-auto mb-4 transition-all duration-300">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2 text-sm md:text-base">{val.title}</h3>
                  <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">{val.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
