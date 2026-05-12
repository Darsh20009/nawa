import { useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { PageHeader } from "@/components/shared/page-header";
import { motion } from "framer-motion";
import { ScrollText, Mail, Phone } from "lucide-react";

interface Section {
  title: string;
  body?: string;
  groups?: { heading?: string; items: string[] }[];
}

const SECTIONS_AR: Section[] = [
  {
    title: "١. مقدمة",
    body:
      "مرحبًا بكم في منصات شركة نوى لتطوير العقاري (ويُشار إليها لاحقًا بـ \"الشركة\" أو \"نحن\"). تحكم هذه الشروط والأحكام (\"الشروط\") استخدامك لكافة المنصات التابعة لنا، بما في ذلك:",
    groups: [
      {
        items: [
          "الموقع الإلكتروني",
          "التطبيقات الذكية",
          "منصات التواصل الاجتماعي",
          "أي منصات رقمية أو تقنية أخرى",
        ],
      },
      {
        items: [
          "ويُعد استخدامك لهذه المنصات موافقة صريحة منك على الالتزام بهذه الشروط وسياسة الخصوصية الخاصة بنا، والتي تُعد جزءًا لا يتجزأ منها.",
        ],
      },
    ],
  },
  {
    title: "٢. الطبيعة القانونية للشروط",
    body:
      "تشكل هذه الشروط اتفاقية قانونية ملزمة بينك وبين شركة نوى لتطوير العقاري، وتحدد حقوقك والتزاماتك عند استخدامك لمنصاتنا أو أي من خدماتنا.",
  },
  {
    title: "٣. نطاق الاستخدام",
    body: "تنطبق هذه الشروط على جميع المستخدمين، سواء:",
    groups: [
      { items: ["زائرين", "عملاء", "مستخدمين مسجلين"] },
      { items: ["ويشمل ذلك جميع أشكال التفاعل مع منصاتنا."] },
    ],
  },
  {
    title: "٤. شروط الأهلية",
    groups: [
      {
        items: [
          "يجب أن يكون المستخدم قد أتم 18 عامًا على الأقل",
          "في حال كان أقل من ذلك، يجب أن يتم الاستخدام تحت إشراف ولي الأمر أو الوصي",
          "يقر المستخدم بصحة البيانات التي يقدمها وتحمله المسؤولية الكاملة عنها",
        ],
      },
    ],
  },
  {
    title: "٥. استخدام المنصات",
    body:
      "يُمنح المستخدم ترخيصًا محدودًا وغير حصري وقابل للإلغاء لاستخدام المنصات للأغراض المشروعة فقط. يُحظر على المستخدم:",
    groups: [
      {
        items: [
          "استخدام المنصات لأي غرض غير نظامي أو غير مصرح به",
          "محاولة اختراق أو تعطيل الأنظمة",
          "نشر محتوى مسيء أو مخالف للأنظمة",
          "إرسال رسائل غير مرغوب بها أو مضايقات",
          "استخدام البيانات لأغراض تسويقية دون إذن",
        ],
      },
    ],
  },
  {
    title: "٦. الملكية الفكرية",
    body: "جميع المحتويات المتاحة على منصاتنا، بما في ذلك:",
    groups: [
      { items: ["النصوص", "التصاميم", "الشعارات", "الصور", "البرمجيات"] },
      {
        items: [
          "هي ملك حصري لشركة نوى لتطوير العقاري أو المرخصين لها، ومحميّة بموجب أنظمة الملكية الفكرية. ولا يجوز نسخها أو إعادة نشرها أو تعديلها أو استغلالها تجاريًا دون موافقة خطية مسبقة.",
        ],
      },
    ],
  },
  {
    title: "٧. المحتوى المقدم من المستخدم",
    body: "عند قيامك بتزويدنا بأي بيانات أو محتوى، فإنك:",
    groups: [
      {
        items: [
          "تقر بملكيتك له أو حصولك على التصاريح اللازمة",
          "تمنحنا ترخيصًا غير حصري لاستخدامه لأغراض تشغيلية أو تطويرية",
          "تتحمل المسؤولية الكاملة عن أي محتوى تقدمه",
        ],
      },
    ],
  },
  {
    title: "٨. طبيعة المعلومات",
    body: "المحتوى المعروض على منصاتنا هو لأغراض معلوماتية فقط، ولا يُعد:",
    groups: [
      {
        items: [
          "عرضًا ملزمًا",
          "توصية استثمارية",
          "دعوة لشراء أو بيع أي أصول أو استثمارات",
        ],
      },
      { items: ["ولا ينبغي الاعتماد عليه بشكل حصري لاتخاذ قرارات مالية أو استثمارية."] },
    ],
  },
  {
    title: "٩. توفر المنصات",
    body: "لا تضمن الشركة:",
    groups: [
      { items: ["استمرارية عمل المنصات دون انقطاع", "خلوها من الأخطاء التقنية"] },
      {
        heading: "ويحق للشركة:",
        items: [
          "تعديل أو إيقاف المنصات كليًا أو جزئيًا",
          "حجب الوصول لأي مستخدم",
          "تحديث المحتوى أو الخدمات",
        ],
      },
      { items: ["في أي وقت ودون إشعار مسبق."] },
    ],
  },
  {
    title: "١٠. خدمات الطرف الثالث",
    body: "قد تحتوي المنصات على روابط أو خدمات مقدمة من أطراف ثالثة. وفي هذه الحالة:",
    groups: [
      {
        items: [
          "لا تتحمل الشركة أي مسؤولية عن محتواها أو دقتها",
          "يخضع استخدامها لشروط تلك الجهات",
          "يتم استخدامها على مسؤوليتك الخاصة",
        ],
      },
    ],
  },
  {
    title: "١١. الأمن السيبراني",
    body: "تلتزم الشركة بتطبيق أفضل ممارسات الأمن، إلا أنها لا تضمن خلو المنصات من:",
    groups: [
      { items: ["الفيروسات", "الهجمات الإلكترونية"] },
      {
        heading: "ويُحظر على المستخدم:",
        items: ["محاولة الدخول غير المصرح به", "تعطيل الأنظمة أو اختراقها"],
      },
      {
        items: [
          "وفي حال المخالفة، سيتم اتخاذ الإجراءات النظامية وإبلاغ الجهات المختصة.",
        ],
      },
    ],
  },
  {
    title: "١٢. إخلاء المسؤولية",
    body: "إلى أقصى حد يسمح به النظام:",
    groups: [
      {
        items: ["يتم تقديم المنصات \"كما هي\" دون أي ضمانات"],
      },
      {
        heading: "لا تتحمل الشركة أي مسؤولية عن:",
        items: [
          "أي خسائر مباشرة أو غير مباشرة",
          "فقدان البيانات",
          "تعطل الأعمال",
          "الأضرار الناتجة عن الاستخدام",
        ],
      },
      { items: ["كما أن استخدامك للمنصات يكون على مسؤوليتك الشخصية بالكامل."] },
    ],
  },
  {
    title: "١٣. التعويض",
    body:
      "يوافق المستخدم على تعويض الشركة وحمايتها من أي مطالبات أو أضرار أو التزامات تنشأ نتيجة:",
    groups: [
      {
        items: ["إساءة استخدام المنصات", "مخالفة هذه الشروط", "انتهاك حقوق الغير"],
      },
    ],
  },
  {
    title: "١٤. إنهاء الاستخدام",
    body: "يحق للشركة:",
    groups: [
      { items: ["تعليق أو إنهاء حساب المستخدم", "حظر الوصول إلى المنصات"] },
      { items: ["في أي وقت ودون إشعار، في حال مخالفة الشروط أو إساءة الاستخدام."] },
    ],
  },
  {
    title: "١٥. التعديلات",
    body:
      "تحتفظ الشركة بحق تعديل هذه الشروط في أي وقت، ويُعد استمرارك في استخدام المنصات موافقة على التعديلات.",
  },
  {
    title: "١٦. النظام المطبق",
    body:
      "تخضع هذه الشروط لأنظمة المملكة العربية السعودية، وتكون المحاكم السعودية هي المختصة بالنظر في أي نزاع.",
  },
  {
    title: "١٧. الاتفاقية الكاملة",
    body:
      "تشكل هذه الشروط، إلى جانب سياسة الخصوصية، الاتفاق الكامل بين المستخدم والشركة، وتلغي أي اتفاقات أو تفاهمات سابقة.",
  },
];

const SECTIONS_EN: Section[] = [
  {
    title: "1. Introduction",
    body:
      'Welcome to the platforms of Nawa Real Estate Development Company (referred to hereafter as the "Company" or "we"). These Terms and Conditions ("Terms") govern your use of all our platforms, including:',
    groups: [
      {
        items: ["The website", "Mobile applications", "Social media channels", "Any other digital or technical platforms"],
      },
      {
        items: [
          "Your use of these platforms constitutes your express agreement to comply with these Terms and our Privacy Policy, which forms an integral part hereof.",
        ],
      },
    ],
  },
  {
    title: "2. Legal Nature of the Terms",
    body:
      "These Terms constitute a legally binding agreement between you and Nawa Real Estate Development Company, defining your rights and obligations when using our platforms or services.",
  },
  {
    title: "3. Scope of Use",
    body: "These Terms apply to all users, whether:",
    groups: [
      { items: ["Visitors", "Customers", "Registered users"] },
      { items: ["This covers all forms of interaction with our platforms."] },
    ],
  },
  {
    title: "4. Eligibility",
    groups: [
      {
        items: [
          "Users must be at least 18 years old",
          "Otherwise, use must be supervised by a parent or guardian",
          "Users acknowledge the accuracy of the data they provide and bear full responsibility for it",
        ],
      },
    ],
  },
  {
    title: "5. Use of Platforms",
    body:
      "Users are granted a limited, non-exclusive, revocable license to use the platforms for lawful purposes only. Users are prohibited from:",
    groups: [
      {
        items: [
          "Using the platforms for any unlawful or unauthorized purpose",
          "Attempting to hack or disrupt the systems",
          "Publishing offensive or unlawful content",
          "Sending spam or harassing messages",
          "Using data for marketing purposes without permission",
        ],
      },
    ],
  },
  {
    title: "6. Intellectual Property",
    body: "All content available on our platforms, including:",
    groups: [
      { items: ["Texts", "Designs", "Logos", "Images", "Software"] },
      {
        items: [
          "Are the exclusive property of Nawa Real Estate Development Company or its licensors, and are protected under intellectual property laws. They may not be copied, republished, modified, or commercially exploited without prior written consent.",
        ],
      },
    ],
  },
  {
    title: "7. User-Submitted Content",
    body: "When you provide us with any data or content, you:",
    groups: [
      {
        items: [
          "Acknowledge ownership or that you have obtained the necessary permissions",
          "Grant us a non-exclusive license to use it for operational or developmental purposes",
          "Bear full responsibility for any content you submit",
        ],
      },
    ],
  },
  {
    title: "8. Nature of Information",
    body: "The content displayed on our platforms is for informational purposes only, and is not considered:",
    groups: [
      {
        items: ["A binding offer", "An investment recommendation", "An invitation to buy or sell any assets or investments"],
      },
      { items: ["It should not be relied upon exclusively for making financial or investment decisions."] },
    ],
  },
  {
    title: "9. Platform Availability",
    body: "The Company does not guarantee:",
    groups: [
      { items: ["Uninterrupted operation of the platforms", "Their freedom from technical errors"] },
      {
        heading: "The Company has the right to:",
        items: ["Modify or suspend the platforms in whole or in part", "Block access to any user", "Update content or services"],
      },
      { items: ["At any time and without prior notice."] },
    ],
  },
  {
    title: "10. Third-Party Services",
    body: "The platforms may contain links or services provided by third parties. In such cases:",
    groups: [
      {
        items: [
          "The Company assumes no responsibility for their content or accuracy",
          "Their use is subject to the terms of those parties",
          "They are used at your own risk",
        ],
      },
    ],
  },
  {
    title: "11. Cybersecurity",
    body: "The Company is committed to applying best security practices, but does not guarantee that the platforms are free from:",
    groups: [
      { items: ["Viruses", "Cyber attacks"] },
      {
        heading: "Users are prohibited from:",
        items: ["Attempting unauthorized access", "Disrupting or hacking the systems"],
      },
      { items: ["In case of violation, legal procedures will be taken and the competent authorities will be notified."] },
    ],
  },
  {
    title: "12. Disclaimer of Liability",
    body: "To the maximum extent permitted by law:",
    groups: [
      { items: ['The platforms are provided "as is" without any warranties'] },
      {
        heading: "The Company assumes no liability for:",
        items: [
          "Any direct or indirect losses",
          "Loss of data",
          "Business interruption",
          "Damages resulting from use",
        ],
      },
      { items: ["Your use of the platforms is entirely at your own risk."] },
    ],
  },
  {
    title: "13. Indemnification",
    body: "The user agrees to indemnify and hold the Company harmless from any claims, damages, or liabilities arising from:",
    groups: [{ items: ["Misuse of the platforms", "Violation of these Terms", "Infringement of others' rights"] }],
  },
  {
    title: "14. Termination of Use",
    body: "The Company has the right to:",
    groups: [
      { items: ["Suspend or terminate the user's account", "Block access to the platforms"] },
      { items: ["At any time and without notice, in case of violation of the Terms or misuse."] },
    ],
  },
  {
    title: "15. Amendments",
    body:
      "The Company reserves the right to amend these Terms at any time, and your continued use of the platforms constitutes acceptance of the amendments.",
  },
  {
    title: "16. Governing Law",
    body:
      "These Terms are governed by the laws of the Kingdom of Saudi Arabia, and Saudi courts have exclusive jurisdiction over any dispute.",
  },
  {
    title: "17. Entire Agreement",
    body:
      "These Terms, together with the Privacy Policy, constitute the entire agreement between the user and the Company, superseding any prior agreements or understandings.",
  },
];

function SectionBlock({ section, index }: { section: Section; index: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.03, 0.3) }}
      className="border-l-2 rtl:border-l-0 rtl:border-r-2 border-secondary/40 pl-6 rtl:pl-0 rtl:pr-6 py-1"
    >
      <h2 className="text-xl md:text-2xl font-serif font-bold text-primary mb-3 leading-snug">
        {section.title}
      </h2>
      {section.body && <p className="text-foreground/75 leading-relaxed text-base">{section.body}</p>}
      {section.groups?.map((g, gi) => (
        <div key={gi} className={section.body || gi > 0 ? "mt-4" : ""}>
          {g.heading && (
            <h3 className="text-sm font-bold text-primary/90 uppercase tracking-wider mb-2">
              {g.heading}
            </h3>
          )}
          <ul className="space-y-2">
            {g.items.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-foreground/75 text-base leading-relaxed"
              >
                <span
                  className="mt-2 w-1.5 h-1.5 rounded-full bg-secondary shrink-0"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </motion.section>
  );
}

export default function Terms() {
  const { language } = useLanguage();
  const sections = language === "ar" ? SECTIONS_AR : SECTIONS_EN;

  useEffect(() => {
    document.title =
      language === "ar"
        ? "الشروط والأحكام | نوى العقارية"
        : "Terms & Conditions | Nawa Real Estate";
  }, [language]);

  return (
    <div className="min-h-screen bg-muted/10 pb-20">
      <PageHeader
        eyebrow={language === "ar" ? "الالتزام التعاقدي" : "Legal Agreement"}
        title={language === "ar" ? "الشروط والأحكام" : "Terms & Conditions"}
        subtitle={
          language === "ar"
            ? "اتفاقية ملزمة تحكم استخدامك لمنصات نوى لتطوير العقاري."
            : "A binding agreement governing your use of Nawa Real Estate Development platforms."
        }
      />

      <div className="container mx-auto px-4 md:px-6 max-w-4xl -mt-10 relative z-10">
        {/* Intro card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl border border-border p-6 md:p-8 mb-10 flex items-start gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-secondary/15 flex items-center justify-center shrink-0">
            <ScrollText className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-secondary font-bold mb-1">
              {language === "ar" ? "آخر تحديث" : "Last updated"}
            </p>
            <p className="text-sm text-foreground/70 leading-relaxed">
              {language === "ar"
                ? "١٢ مايو ٢٠٢٦ — شركة نوى لتطوير العقاري، المملكة العربية السعودية."
                : "May 12, 2026 — Nawa Real Estate Development Company, Kingdom of Saudi Arabia."}
            </p>
          </div>
        </motion.div>

        {/* Sections */}
        <div className="bg-white rounded-2xl shadow-sm border border-border p-6 md:p-12 space-y-10">
          {sections.map((s, i) => (
            <SectionBlock key={i} section={s} index={i} />
          ))}
        </div>

        {/* Contact card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-10 bg-primary text-white rounded-2xl shadow-lg p-6 md:p-10"
        >
          <h3 className="text-xl md:text-2xl font-serif font-bold mb-2">
            {language === "ar" ? "للاستفسارات القانونية" : "Legal Inquiries"}
          </h3>
          <p className="text-white/70 text-sm mb-6 leading-relaxed">
            {language === "ar"
              ? "للاستفسارات المتعلقة بالشروط أو الالتزامات التعاقدية، يمكنك التواصل معنا عبر:"
              : "For inquiries regarding these Terms or contractual obligations, please contact us via:"}
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:info@nawainv.sa"
              className="inline-flex items-center gap-2 bg-secondary text-primary hover:bg-white transition-colors px-5 py-3 rounded-xl text-sm font-bold"
            >
              <Mail className="w-4 h-4" />
              info@nawainv.sa
            </a>
            <a
              href="tel:+966500073509"
              dir="ltr"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 transition-colors px-5 py-3 rounded-xl text-sm font-bold"
            >
              <Phone className="w-4 h-4" />
              +966 50 007 3509
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
