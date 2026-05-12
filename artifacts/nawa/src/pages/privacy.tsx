import { useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";

export default function Privacy() {
  const { language } = useLanguage();

  useEffect(() => {
    document.title = language === "ar" ? "سياسة الخصوصية | نوى العقارية" : "Privacy Policy | Nawa Real Estate Platform";
  }, [language]);

  return (
    <div className="pt-32 pb-20 min-h-screen">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <h1 className="text-4xl font-bold font-serif mb-8 text-primary">
          {language === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}
        </h1>
        
        <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground">
          {language === "ar" ? (
            <>
              <p>تاريخ آخر تحديث: 1 يناير 2026</p>
              <h2>1. مقدمة</h2>
              <p>نحن في نوى العقارية نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية معلوماتك عند استخدام منصتنا.</p>
              
              <h2>2. البيانات التي نجمعها</h2>
              <p>قد نجمع البيانات التالية:</p>
              <ul>
                <li>معلومات الهوية (الاسم، وتاريخ الميلاد، وما إلى ذلك).</li>
                <li>معلومات الاتصال (عنوان البريد الإلكتروني، ورقم الهاتف، وما إلى ذلك).</li>
                <li>البيانات التقنية (عنوان IP، ونوع المتصفح، وما إلى ذلك).</li>
                <li>بيانات الاستخدام (كيفية تفاعلك مع منصتنا).</li>
              </ul>
              
              <h2>3. كيف نستخدم بياناتك</h2>
              <p>نستخدم بياناتك للأغراض التالية:</p>
              <ul>
                <li>لتقديم خدماتنا العقارية وإدارتها.</li>
                <li>لتحسين منصتنا وتجربة المستخدم.</li>
                <li>للتواصل معك بشأن استفساراتك أو لتحديثات هامة.</li>
                <li>للامتثال للمتطلبات القانونية والتنظيمية.</li>
              </ul>
            </>
          ) : (
            <>
              <p>Last updated: January 1, 2026</p>
              <h2>1. Introduction</h2>
              <p>At Nawa Real Estate Platform, we respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and protect your information when you use our platform.</p>
              
              <h2>2. Data We Collect</h2>
              <p>We may collect the following data:</p>
              <ul>
                <li>Identity information (Name, Date of Birth, etc.).</li>
                <li>Contact information (Email address, Phone number, etc.).</li>
                <li>Technical data (IP address, Browser type, etc.).</li>
                <li>Usage data (How you interact with our platform).</li>
              </ul>
              
              <h2>3. How We Use Your Data</h2>
              <p>We use your data for the following purposes:</p>
              <ul>
                <li>To provide and manage our real estate services.</li>
                <li>To improve our platform and user experience.</li>
                <li>To communicate with you regarding your inquiries or important updates.</li>
                <li>To comply with legal and regulatory requirements.</li>
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}