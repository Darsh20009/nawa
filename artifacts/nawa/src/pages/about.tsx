import { useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/constants";
import { motion } from "framer-motion";

export default function About() {
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    document.title = `${t.about} | منصة نوى العقارية`;
  }, [t.about]);

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-bold font-serif mb-8 text-primary">
            {t.about}
          </h1>
          
          <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground">
            {language === "ar" ? (
              <>
                <p className="text-xl leading-relaxed text-foreground mb-8">
                  نحن في منصة نوى العقارية نؤمن بأن العقار ليس مجرد مساحة، بل هو أصل ينمو ومستقبل يُبنى. انطلقنا من المملكة العربية السعودية برؤية طموحة تواكب تطلعات رؤية 2030، لنقدم حلاً متكاملاً في عالم الاستثمار العقاري.
                </p>
                <div className="grid md:grid-cols-2 gap-12 my-12">
                  <div className="bg-muted p-8 rounded-2xl">
                    <h3 className="text-2xl font-bold text-primary mb-4">رؤيتنا</h3>
                    <p>أن نكون المنصة الرائدة والأكثر موثوقية في تقديم الفرص الاستثمارية العقارية المبتكرة في الشرق الأوسط، بمعايير عالمية ولمسة محلية أصيلة.</p>
                  </div>
                  <div className="bg-secondary/10 p-8 rounded-2xl">
                    <h3 className="text-2xl font-bold text-secondary-foreground mb-4">رسالتنا</h3>
                    <p>تمكين المستثمرين من الوصول إلى أفضل المشاريع العقارية بذكاء وشفافية، وتقديم خدمات متكاملة تضمن أعلى العوائد وأفضل التجارب.</p>
                  </div>
                </div>
                <h2>قيمنا الأساسية</h2>
                <ul className="space-y-4">
                  <li><strong>الشفافية:</strong> وضوح تام في كافة التعاملات والتفاصيل المالية.</li>
                  <li><strong>الابتكار:</strong> توظيف أحدث التقنيات لخدمة القطاع العقاري.</li>
                  <li><strong>الجودة:</strong> التزام لا يتزعزع بأعلى المعايير في مشاريعنا وخدماتنا.</li>
                  <li><strong>الموثوقية:</strong> بناء ثقة مستدامة مع شركائنا وعملائنا.</li>
                </ul>
              </>
            ) : (
              <>
                <p className="text-xl leading-relaxed text-foreground mb-8">
                  At Nawa Real Estate Platform, we believe that real estate is not just a space, but an asset that grows and a future that is built. We started in Saudi Arabia with an ambitious vision aligned with Vision 2030, to provide an integrated solution in the world of real estate investment.
                </p>
                <div className="grid md:grid-cols-2 gap-12 my-12">
                  <div className="bg-muted p-8 rounded-2xl">
                    <h3 className="text-2xl font-bold text-primary mb-4">Our Vision</h3>
                    <p>To be the leading and most trusted platform in providing innovative real estate investment opportunities in the Middle East, with global standards and an authentic local touch.</p>
                  </div>
                  <div className="bg-secondary/10 p-8 rounded-2xl">
                    <h3 className="text-2xl font-bold text-secondary-foreground mb-4">Our Mission</h3>
                    <p>Empowering investors to access the best real estate projects intelligently and transparently, and providing integrated services that ensure the highest returns and best experiences.</p>
                  </div>
                </div>
                <h2>Our Core Values</h2>
                <ul className="space-y-4">
                  <li><strong>Transparency:</strong> Complete clarity in all transactions and financial details.</li>
                  <li><strong>Innovation:</strong> Utilizing the latest technologies to serve the real estate sector.</li>
                  <li><strong>Quality:</strong> Unwavering commitment to the highest standards in our projects and services.</li>
                  <li><strong>Reliability:</strong> Building sustainable trust with our partners and clients.</li>
                </ul>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}