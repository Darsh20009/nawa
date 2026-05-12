import { useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";

export default function Terms() {
  const { language } = useLanguage();

  useEffect(() => {
    document.title = language === "ar" ? "الشروط والأحكام | منصة نوى العقارية" : "Terms & Conditions | Nawa Real Estate Platform";
  }, [language]);

  return (
    <div className="pt-32 pb-20 min-h-screen">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <h1 className="text-4xl font-bold font-serif mb-8 text-primary">
          {language === "ar" ? "الشروط والأحكام" : "Terms & Conditions"}
        </h1>
        
        <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground">
          {language === "ar" ? (
            <>
              <p>تاريخ آخر تحديث: 1 يناير 2026</p>
              <h2>1. قبول الشروط</h2>
              <p>بدخولك أو استخدامك لمنصة نوى العقارية، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على هذه الشروط، يرجى عدم استخدام المنصة.</p>
              
              <h2>2. استخدام المنصة</h2>
              <p>يجب استخدام المنصة لأغراض قانونية فقط وبطريقة لا تنتهك حقوق الآخرين أو تقيد أو تمنع استخدامهم للمنصة. يمنع منعاً باتاً أي استخدام غير مصرح به قد يؤدي إلى مطالبة بالتعويض عن الأضرار أو يشكل جريمة جنائية.</p>
              
              <h2>3. الملكية الفكرية</h2>
              <p>جميع المحتويات على هذه المنصة، بما في ذلك النصوص والتصميمات والرسومات والشعارات، هي ملك لمنصة نوى العقارية ومحمية بقوانين حقوق النشر. لا يجوز إعادة إنتاج أو توزيع أو استخدام أي من هذه المحتويات دون إذن كتابي مسبق.</p>
              
              <h2>4. إخلاء المسؤولية</h2>
              <p>يتم توفير المعلومات على هذه المنصة "كما هي" دون أي ضمانات من أي نوع. لا نتحمل المسؤولية عن أي أخطاء أو سهو في المحتوى، ولا عن أي خسائر قد تنشأ عن الاعتماد على المعلومات المقدمة.</p>
            </>
          ) : (
            <>
              <p>Last updated: January 1, 2026</p>
              <h2>1. Acceptance of Terms</h2>
              <p>By accessing or using the Nawa Real Estate Platform, you agree to be bound by these terms and conditions. If you do not agree with these terms, please do not use the platform.</p>
              
              <h2>2. Use of the Platform</h2>
              <p>The platform must be used for lawful purposes only and in a way that does not infringe the rights of, restrict or inhibit anyone else's use of the platform. Any unauthorized use that may give rise to a claim for damages or be a criminal offense is strictly prohibited.</p>
              
              <h2>3. Intellectual Property</h2>
              <p>All content on this platform, including text, designs, graphics, and logos, is the property of Nawa Real Estate Platform and is protected by copyright laws. None of this content may be reproduced, distributed, or used without prior written permission.</p>
              
              <h2>4. Disclaimer</h2>
              <p>The information on this platform is provided "as is" without any warranties of any kind. We are not liable for any errors or omissions in the content, nor for any losses that may arise from reliance on the information provided.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}