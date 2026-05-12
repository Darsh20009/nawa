import { useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { PageHeader } from "@/components/shared/page-header";
import { motion } from "framer-motion";
import { ShieldCheck, Mail, Phone } from "lucide-react";

interface Section {
  title: string;
  body?: string;
  groups?: { heading?: string; items: string[] }[];
}

const SECTIONS_AR: Section[] = [
  {
    title: "١. المقدمة",
    body:
      "تلتزم شركة نوى لتطوير العقاري التزامًا كاملاً بحماية خصوصية البيانات الشخصية لجميع عملائها وشركائها وزوار منصاتها، وتدرك أن البيانات الشخصية تُعد من الأصول ذات القيمة العالية التي تستوجب أعلى درجات الحماية والحوكمة. وعليه، فقد تم إعداد هذه السياسة بما يتوافق مع نظام حماية البيانات الشخصية في المملكة العربية السعودية ولوائحه التنفيذية، لضمان معالجة البيانات بطريقة نظامية، عادلة، آمنة، وشفافة.",
  },
  {
    title: "٢. الأساس النظامي للمعالجة",
    body: "تعتمد الشركة في معالجة البيانات الشخصية على أحد أو أكثر من الأسس النظامية التالية:",
    groups: [
      {
        items: [
          "موافقة صاحب البيانات الصريحة",
          "الالتزامات التعاقدية",
          "المتطلبات النظامية والتنظيمية",
          "تحقيق المصالح المشروعة للشركة دون الإخلال بحقوق الأفراد",
          "تنفيذ متطلبات الجهات القضائية أو الأمنية",
        ],
      },
    ],
  },
  {
    title: "٣. نطاق التطبيق",
    body: "تسري هذه السياسة على جميع عمليات جمع ومعالجة وتخزين ومشاركة البيانات الشخصية التي تتم من خلال:",
    groups: [
      {
        items: [
          "التعاملات المباشرة",
          "المنصات الرقمية (الموقع، التطبيقات)",
          "العقود والاتفاقيات",
          "قنوات خدمة العملاء والتسويق",
        ],
      },
    ],
  },
  {
    title: "٤. فئات البيانات الشخصية",
    body: "تشمل البيانات التي قد تقوم الشركة بجمعها ومعالجتها ما يلي:",
    groups: [
      {
        heading: "أولًا: بيانات التعريف",
        items: ["الاسم الكامل", "رقم الهوية الوطنية / الإقامة / جواز السفر", "الجنسية", "تاريخ الميلاد"],
      },
      {
        heading: "ثانيًا: بيانات التواصل",
        items: ["أرقام الهواتف", "البريد الإلكتروني", "العنوان الوطني"],
      },
      {
        heading: "ثالثًا: البيانات المهنية والمالية",
        items: [
          "جهة العمل",
          "المسمى الوظيفي",
          "مستوى الدخل (عند الحاجة)",
          "أي بيانات مرتبطة بالتعاملات المالية أو التمويلية",
        ],
      },
      {
        heading: "رابعًا: بيانات التفاعل",
        items: ["المكالمات الهاتفية (قد يتم تسجيلها لأغراض الجودة)", "الرسائل والمراسلات", "سجل الطلبات والخدمات"],
      },
      {
        heading: "خامسًا: البيانات التقنية",
        items: ["عنوان بروتوكول الإنترنت (IP)", "نوع الجهاز ونظام التشغيل", "معلومات المتصفح وسجل الاستخدام"],
      },
      {
        heading: "سادسًا: بيانات الموقع",
        items: ["الموقع الجغرافي التقريبي أو الدقيق عند استخدام المنصات"],
      },
      {
        heading: "سابعًا: بيانات التتبع",
        items: ["ملفات تعريف الارتباط (Cookies)", "تقنيات التحليل الرقمي"],
      },
    ],
  },
  {
    title: "٥. آلية جمع البيانات",
    body: "يتم جمع البيانات من خلال:",
    groups: [
      {
        items: [
          "البيانات التي يقدمها صاحبها مباشرة",
          "الجهات الحكومية والجهات التنظيمية",
          "المؤسسات المالية",
          "مزودي الخدمات والشركاء",
          "مصادر موثوقة ومصرح بها نظاميًا",
        ],
      },
    ],
  },
  {
    title: "٦. أغراض المعالجة",
    body: "تتم معالجة البيانات الشخصية لتحقيق الأغراض التالية:",
    groups: [
      {
        items: [
          "إبرام وتنفيذ العقود والاتفاقيات",
          "تقديم الخدمات العقارية وإدارة المشاريع",
          "التحقق من الهوية والامتثال النظامي",
          "تحسين جودة الخدمات وتجربة العميل",
          "التواصل مع العملاء وتلبية الطلبات",
          "إدارة الشكاوى والملاحظات",
          "التحليل والتطوير الداخلي",
          "تنفيذ الحملات التسويقية (بموافقة العميل)",
          "حماية الأنظمة ومنع الاحتيال",
          "الامتثال للأنظمة والتعليمات الرسمية",
        ],
      },
    ],
  },
  {
    title: "٧. مشاركة البيانات والإفصاح عنها",
    body: "تلتزم الشركة بعدم الإفصاح عن البيانات الشخصية إلا في الحالات التالية:",
    groups: [
      { heading: "داخليًا", items: ["بين الإدارات المعنية وفق مبدأ الحاجة إلى المعرفة"] },
      {
        heading: "خارجيًا",
        items: [
          "الجهات الحكومية أو القضائية المختصة",
          "مزودي الخدمات (تقنية، تشغيل، تسويق، استضافة)",
          "المستشارين القانونيين والمراجعين",
          "الجهات المختصة بمكافحة الاحتيال",
        ],
      },
      {
        items: ["وذلك وفق ضوابط تعاقدية تضمن سرية البيانات وحمايتها."],
      },
    ],
  },
  {
    title: "٨. نقل البيانات خارج المملكة",
    body:
      "قد يتم نقل البيانات الشخصية خارج المملكة العربية السعودية عند الضرورة، مع الالتزام بكافة الضوابط النظامية، واتخاذ التدابير التعاقدية والتقنية الكفيلة بحماية البيانات.",
  },
  {
    title: "٩. مدة الاحتفاظ بالبيانات",
    body: "تحتفظ الشركة بالبيانات الشخصية:",
    groups: [
      {
        items: [
          "طوال فترة العلاقة التعاقدية",
          "وللمدة اللازمة لتحقيق الغرض من جمعها",
          "أو حسب ما تفرضه الأنظمة واللوائح",
        ],
      },
      {
        items: ["وسيتم إتلاف البيانات بشكل آمن بعد انتهاء الغرض منها."],
      },
    ],
  },
  {
    title: "١٠. أمن وحماية البيانات",
    body: "تطبق الشركة إطارًا متكاملًا لحوكمة وأمن المعلومات، يشمل:",
    groups: [
      {
        items: [
          "أنظمة حماية إلكترونية متقدمة",
          "التشفير وإدارة الوصول",
          "المراقبة المستمرة",
          "سياسات وإجراءات داخلية صارمة",
          "تدريب الموظفين على حماية البيانات",
        ],
      },
    ],
  },
  {
    title: "١١. ملفات تعريف الارتباط والتقنيات المشابهة",
    body: "تستخدم الشركة ملفات تعريف الارتباط لأغراض:",
    groups: [
      { items: ["تحسين الأداء", "تحليل الاستخدام", "تخصيص المحتوى"] },
      { items: ["ويحق للمستخدم التحكم بها من خلال إعدادات المتصفح."] },
    ],
  },
  {
    title: "١٢. حقوق أصحاب البيانات",
    body: "وفقًا لنظام حماية البيانات الشخصية في المملكة، يحق لك:",
    groups: [
      {
        items: [
          "الاطلاع على بياناتك الشخصية",
          "طلب نسخة منها",
          "تصحيح أو تحديث بياناتك",
          "طلب إتلاف البيانات في الحالات النظامية",
          "سحب الموافقة على المعالجة",
          "تقديم شكوى للجهة المختصة",
        ],
      },
    ],
  },
  {
    title: "١٣. التعديلات على السياسة",
    body: "تحتفظ الشركة بحق تعديل هذه السياسة في أي وقت، وسيتم نشر التحديثات عبر القنوات الرسمية.",
  },
  {
    title: "١٤. التواصل",
    body: "للاستفسارات المتعلقة بالخصوصية، يمكن التواصل عبر:",
    groups: [
      {
        items: [
          "البريد الإلكتروني: info@nawainv.sa",
          "رقم الهاتف: ٩٦٦٥٠٠٠٧٣٥٠٩+",
        ],
      },
    ],
  },
  {
    title: "١٥. الإقرار والموافقة",
    body:
      "باستخدامك لخدمات شركة نوى لتطوير العقاري، فإنك تقر باطلاعك على هذه السياسة وموافقتك على ما ورد فيها.",
  },
];

const SECTIONS_EN: Section[] = [
  {
    title: "1. Introduction",
    body:
      "Nawa Real Estate Development Company is fully committed to protecting the privacy of personal data of all its clients, partners, and platform visitors. We recognize personal data as a high-value asset that demands the highest standards of protection and governance. This policy has been prepared in compliance with the Personal Data Protection Law of the Kingdom of Saudi Arabia and its executive regulations, ensuring that data is processed in a lawful, fair, secure, and transparent manner.",
  },
  {
    title: "2. Legal Basis for Processing",
    body: "The Company processes personal data based on one or more of the following legal grounds:",
    groups: [
      {
        items: [
          "Explicit consent of the data subject",
          "Contractual obligations",
          "Statutory and regulatory requirements",
          "Legitimate interests of the Company without prejudice to individual rights",
          "Fulfilling requirements of judicial or security authorities",
        ],
      },
    ],
  },
  {
    title: "3. Scope of Application",
    body:
      "This policy applies to all collection, processing, storage, and sharing of personal data carried out through:",
    groups: [
      {
        items: [
          "Direct interactions",
          "Digital platforms (website, applications)",
          "Contracts and agreements",
          "Customer service and marketing channels",
        ],
      },
    ],
  },
  {
    title: "4. Categories of Personal Data",
    body: "The data the Company may collect and process includes:",
    groups: [
      {
        heading: "First: Identification Data",
        items: ["Full name", "National ID / Iqama / Passport number", "Nationality", "Date of birth"],
      },
      {
        heading: "Second: Contact Data",
        items: ["Phone numbers", "Email address", "National address"],
      },
      {
        heading: "Third: Professional & Financial Data",
        items: ["Employer", "Job title", "Income level (when needed)", "Any data related to financial or financing transactions"],
      },
      {
        heading: "Fourth: Interaction Data",
        items: ["Phone calls (may be recorded for quality assurance)", "Messages and correspondence", "Service and order history"],
      },
      {
        heading: "Fifth: Technical Data",
        items: ["IP address", "Device type and operating system", "Browser information and usage history"],
      },
      {
        heading: "Sixth: Location Data",
        items: ["Approximate or precise geographic location when using platforms"],
      },
      {
        heading: "Seventh: Tracking Data",
        items: ["Cookies", "Digital analytics technologies"],
      },
    ],
  },
  {
    title: "5. How We Collect Data",
    body: "Data is collected through:",
    groups: [
      {
        items: [
          "Data provided directly by the data subject",
          "Government and regulatory authorities",
          "Financial institutions",
          "Service providers and partners",
          "Trusted and legally authorized sources",
        ],
      },
    ],
  },
  {
    title: "6. Purposes of Processing",
    body: "Personal data is processed for the following purposes:",
    groups: [
      {
        items: [
          "Concluding and executing contracts and agreements",
          "Providing real estate services and managing projects",
          "Identity verification and regulatory compliance",
          "Improving service quality and customer experience",
          "Communicating with clients and fulfilling requests",
          "Handling complaints and feedback",
          "Internal analysis and development",
          "Conducting marketing campaigns (with client consent)",
          "Protecting systems and preventing fraud",
          "Compliance with applicable laws and official directives",
        ],
      },
    ],
  },
  {
    title: "7. Data Sharing & Disclosure",
    body: "The Company will not disclose personal data except in the following cases:",
    groups: [
      { heading: "Internally", items: ["Among relevant departments on a need-to-know basis"] },
      {
        heading: "Externally",
        items: [
          "Competent governmental or judicial authorities",
          "Service providers (technology, operations, marketing, hosting)",
          "Legal counsel and auditors",
          "Authorities responsible for fraud prevention",
        ],
      },
      {
        items: ["All such disclosures are subject to contractual safeguards ensuring data confidentiality and protection."],
      },
    ],
  },
  {
    title: "8. International Data Transfers",
    body:
      "Personal data may be transferred outside the Kingdom of Saudi Arabia when necessary, while complying with all regulatory controls and adopting contractual and technical measures to safeguard the data.",
  },
  {
    title: "9. Data Retention Period",
    body: "The Company retains personal data:",
    groups: [
      {
        items: [
          "For the duration of the contractual relationship",
          "For the period necessary to fulfill the purpose of collection",
          "Or as required by laws and regulations",
        ],
      },
      {
        items: ["Data will be securely destroyed once the purpose for its collection has been fulfilled."],
      },
    ],
  },
  {
    title: "10. Data Security & Protection",
    body: "The Company applies a comprehensive information security and governance framework, including:",
    groups: [
      {
        items: [
          "Advanced electronic protection systems",
          "Encryption and access management",
          "Continuous monitoring",
          "Strict internal policies and procedures",
          "Employee training on data protection",
        ],
      },
    ],
  },
  {
    title: "11. Cookies & Similar Technologies",
    body: "The Company uses cookies for the following purposes:",
    groups: [
      { items: ["Performance improvement", "Usage analytics", "Content personalization"] },
      { items: ["Users have the right to manage cookies through their browser settings."] },
    ],
  },
  {
    title: "12. Data Subject Rights",
    body: "Under the Personal Data Protection Law of Saudi Arabia, you have the right to:",
    groups: [
      {
        items: [
          "Access your personal data",
          "Request a copy of it",
          "Correct or update your data",
          "Request deletion of data in regulatory cases",
          "Withdraw consent for processing",
          "File a complaint with the competent authority",
        ],
      },
    ],
  },
  {
    title: "13. Policy Amendments",
    body:
      "The Company reserves the right to amend this policy at any time. Updates will be published through official channels.",
  },
  {
    title: "14. Contact",
    body: "For privacy-related inquiries, you may reach us via:",
    groups: [
      {
        items: ["Email: info@nawainv.sa", "Phone: +966 50 007 3509"],
      },
    ],
  },
  {
    title: "15. Acknowledgment & Consent",
    body:
      "By using Nawa Real Estate Development Company services, you acknowledge that you have read this policy and consent to its terms.",
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
      {section.body && (
        <p className="text-foreground/75 leading-relaxed text-base">{section.body}</p>
      )}
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

export default function Privacy() {
  const { language } = useLanguage();
  const sections = language === "ar" ? SECTIONS_AR : SECTIONS_EN;

  useEffect(() => {
    document.title =
      language === "ar"
        ? "سياسة الخصوصية | نوى العقارية"
        : "Privacy Policy | Nawa Real Estate";
  }, [language]);

  return (
    <div className="min-h-screen bg-muted/10 pb-20">
      <PageHeader
        eyebrow={language === "ar" ? "الالتزام والخصوصية" : "Compliance & Privacy"}
        title={language === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}
        subtitle={
          language === "ar"
            ? "متوافقة مع نظام حماية البيانات الشخصية في المملكة العربية السعودية."
            : "Aligned with the Personal Data Protection Law of the Kingdom of Saudi Arabia."
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
            <ShieldCheck className="w-6 h-6 text-secondary" />
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
            {language === "ar" ? "للاستفسارات المتعلقة بالخصوصية" : "Privacy Inquiries"}
          </h3>
          <p className="text-white/70 text-sm mb-6 leading-relaxed">
            {language === "ar"
              ? "لأي استفسار يخص بياناتك الشخصية أو ممارسة حقوقك المنصوص عليها في النظام، تواصل معنا عبر:"
              : "For any inquiry regarding your personal data or to exercise your statutory rights, please contact us via:"}
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
