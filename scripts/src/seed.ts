import { db } from "@workspace/db";
import {
  usersTable,
  projectsTable,
  servicesTable,
  newsTable,
  jobsTable,
  brokersTable,
  boardMembersTable,
  conversationsTable,
} from "@workspace/db";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding database...");

  // Users
  const existingUsers = await db.select().from(usersTable);
  if (existingUsers.length === 0) {
    const adminPassword = await bcrypt.hash("admin123", 12);
    await db.insert(usersTable).values([
      {
        name: "Admin Nawa",
        nameAr: "مدير نوى",
        email: "admin@nawainv.sa",
        password: adminPassword,
        role: "super_admin",
        department: "Management",
        active: true,
      },
      {
        name: "Ahmed Al-Rashid",
        nameAr: "أحمد الراشد",
        email: "ahmed@nawainv.sa",
        password: adminPassword,
        role: "manager",
        department: "Sales",
        active: true,
      },
      {
        name: "Sara Al-Khalid",
        nameAr: "سارة الخالد",
        email: "sara@nawainv.sa",
        password: adminPassword,
        role: "content_manager",
        department: "Marketing",
        active: true,
      },
    ]);
    console.log("✓ Users seeded");
  }

  // Projects
  const existingProjects = await db.select().from(projectsTable);
  if (existingProjects.length === 0) {
    await db.insert(projectsTable).values([
      {
        title: "Nawa Skyline Tower",
        titleAr: "برج نوى سكايلاين",
        description: "A landmark mixed-use development in the heart of Riyadh, featuring premium residential units and Class A office spaces.",
        descriptionAr: "مشروع متكامل متعدد الاستخدامات في قلب الرياض، يضم وحدات سكنية فاخرة ومكاتب تجارية من الدرجة الأولى.",
        location: "Riyadh, King Fahd Road",
        locationAr: "الرياض، طريق الملك فهد",
        status: "active",
        type: "mixed-use",
        totalUnits: 240,
        availableUnits: 87,
        completionPercentage: 65,
        featured: true,
        price: "Starting from SAR 1,200,000",
        area: "180 - 450 m²",
      },
      {
        title: "Nawa Gardens Compound",
        titleAr: "مجمع نوى الحدائق",
        description: "An exclusive gated community offering luxurious villas surrounded by lush landscaping in Jeddah's prestigious districts.",
        descriptionAr: "مجمع سكني فاخر مسوّر يضم فيلات راقية وسط حدائق خضراء في أرقى أحياء جدة.",
        location: "Jeddah, Al-Hamra District",
        locationAr: "جدة، حي الحمراء",
        status: "active",
        type: "residential",
        totalUnits: 48,
        availableUnits: 12,
        completionPercentage: 85,
        featured: true,
        price: "Starting from SAR 3,500,000",
        area: "450 - 900 m²",
      },
      {
        title: "Nawa Business Park",
        titleAr: "نوى بارك للأعمال",
        description: "State-of-the-art commercial complex designed for forward-thinking enterprises seeking premium workspace.",
        descriptionAr: "مجمع تجاري متطور مصمم للشركات الطموحة الباحثة عن بيئة عمل متميزة.",
        location: "Riyadh, KAFD",
        locationAr: "الرياض، مركز الملك عبدالله المالي",
        status: "planning",
        type: "commercial",
        totalUnits: 120,
        availableUnits: 120,
        completionPercentage: 15,
        featured: false,
        price: "Starting from SAR 800,000",
        area: "80 - 500 m²",
      },
      {
        title: "Nawa Residences Al-Khobar",
        titleAr: "نوى ريزيدنسز الخبر",
        description: "Sea-view apartments in Al-Khobar, offering a refined coastal lifestyle with premium amenities.",
        descriptionAr: "شقق مطلة على البحر في الخبر، توفر أسلوب حياة ساحلي راقٍ مع مرافق متميزة.",
        location: "Al-Khobar, Corniche",
        locationAr: "الخبر، الكورنيش",
        status: "completed",
        type: "residential",
        totalUnits: 180,
        availableUnits: 24,
        completionPercentage: 100,
        featured: false,
        price: "Starting from SAR 950,000",
        area: "120 - 280 m²",
      },
    ]);
    console.log("✓ Projects seeded");
  }

  // Services
  const existingServices = await db.select().from(servicesTable);
  if (existingServices.length === 0) {
    await db.insert(servicesTable).values([
      {
        title: "Real Estate Investment",
        titleAr: "الاستثمار العقاري",
        description: "Expert guidance on high-yield real estate investment opportunities across Saudi Arabia's most promising markets.",
        descriptionAr: "إرشادات متخصصة حول فرص الاستثمار العقاري ذات العائد المرتفع في أبرز أسواق المملكة العربية السعودية.",
        icon: "TrendingUp",
        order: 1,
      },
      {
        title: "Property Development",
        titleAr: "تطوير العقارات",
        description: "Full-cycle property development from land acquisition to project delivery, ensuring world-class standards.",
        descriptionAr: "تطوير عقاري متكامل من اقتناء الأراضي إلى تسليم المشروع وفق أعلى المعايير العالمية.",
        icon: "Building",
        order: 2,
      },
      {
        title: "Property Management",
        titleAr: "إدارة الأصول العقارية",
        description: "Comprehensive asset management services maximizing returns and preserving property value over time.",
        descriptionAr: "خدمات إدارة أصول شاملة تعظم العوائد وتحافظ على قيمة العقار على المدى الطويل.",
        icon: "BarChart3",
        order: 3,
      },
      {
        title: "Market Advisory",
        titleAr: "الاستشارات السوقية",
        description: "Data-driven market insights and strategic advisory for individual investors and institutional clients.",
        descriptionAr: "رؤى سوقية مبنية على البيانات واستشارات استراتيجية للمستثمرين الأفراد والمؤسسات.",
        icon: "LineChart",
        order: 4,
      },
      {
        title: "Brokerage Services",
        titleAr: "خدمات الوساطة العقارية",
        description: "Professional brokerage connecting buyers and sellers with market-leading expertise and an extensive network.",
        descriptionAr: "وساطة عقارية احترافية تربط المشترين والبائعين بخبرة رائدة في السوق وشبكة علاقات واسعة.",
        icon: "Handshake",
        order: 5,
      },
      {
        title: "Valuation & Appraisal",
        titleAr: "التقييم والتثمين العقاري",
        description: "Certified property valuation services adhering to international standards for accurate, reliable assessments.",
        descriptionAr: "خدمات تقييم عقاري معتمدة وفق المعايير الدولية لتقديم تقييمات دقيقة وموثوقة.",
        icon: "Search",
        order: 6,
      },
    ]);
    console.log("✓ Services seeded");
  }

  // News
  const existingNews = await db.select().from(newsTable);
  if (existingNews.length === 0) {
    await db.insert(newsTable).values([
      {
        title: "Nawa Real Estate Launches Premium Tower in Riyadh",
        titleAr: "نوى العقارية تطلق برجاً فاخراً في الرياض",
        content: "Nawa Real Estate is proud to announce the launch of Nawa Skyline Tower, a landmark development that redefines luxury living in the heart of Riyadh. The 35-floor mixed-use tower will feature 240 premium units alongside Class A commercial spaces.",
        contentAr: "تفخر نوى العقارية بالإعلان عن إطلاق برج نوى سكايلاين، المشروع الذي يُعيد تعريف السكن الراقي في قلب الرياض. سيضم هذا البرج الزجاجي الشاهق 35 طابقاً و240 وحدة سكنية فاخرة إلى جانب مساحات تجارية من الدرجة الأولى.",
        category: "press-release",
        featured: true,
        publishedAt: new Date("2026-04-15"),
      },
      {
        title: "Saudi Real Estate Market Outlook 2026: Opportunities Ahead",
        titleAr: "توقعات سوق العقارات السعودي 2026: فرص واعدة في الأفق",
        content: "The Saudi real estate sector continues its strong growth trajectory in 2026, driven by Vision 2030 mega-projects, increasing domestic demand, and favorable government incentives for investors.",
        contentAr: "يواصل القطاع العقاري السعودي مسيرته النمو القوي في عام 2026، مدفوعاً بمشاريع رؤية 2030 العملاقة وارتفاع الطلب المحلي والحوافز الحكومية المواتية للمستثمرين.",
        category: "market-insights",
        featured: true,
        publishedAt: new Date("2026-03-20"),
      },
      {
        title: "Nawa Gardens Compound: 85% Sold Ahead of Schedule",
        titleAr: "مجمع نوى الحدائق: بيع 85% من الوحدات قبل موعد الإنجاز",
        content: "The overwhelming demand for Nawa Gardens Compound in Jeddah has resulted in 85% of units being sold months before the project's completion date, reflecting investor confidence in Nawa's developments.",
        contentAr: "أسفر الطلب المتزايد على مجمع نوى الحدائق في جدة عن بيع 85% من الوحدات قبل أشهر من تاريخ الاكتمال، مما يعكس ثقة المستثمرين بمشاريع نوى العقارية.",
        category: "news",
        featured: false,
        publishedAt: new Date("2026-02-10"),
      },
    ]);
    console.log("✓ News seeded");
  }

  // Jobs
  const existingJobs = await db.select().from(jobsTable);
  if (existingJobs.length === 0) {
    await db.insert(jobsTable).values([
      {
        title: "Senior Sales Executive",
        titleAr: "مدير مبيعات أول",
        description: "Lead high-value property sales transactions and build relationships with premium clients.",
        descriptionAr: "قيادة صفقات بيع العقارات عالية القيمة وبناء علاقات مع العملاء المميزين.",
        department: "Sales",
        departmentAr: "المبيعات",
        type: "full-time",
        location: "Riyadh",
        requirements: "5+ years in real estate sales, strong network, RERA certified",
        requirementsAr: "خبرة 5+ سنوات في مبيعات العقارات، شبكة علاقات قوية، شهادة هيئة العقارات",
        active: true,
      },
      {
        title: "Real Estate Investment Analyst",
        titleAr: "محلل استثمار عقاري",
        description: "Conduct market research, financial modeling, and investment analysis for new project opportunities.",
        descriptionAr: "إجراء أبحاث السوق والنمذجة المالية وتحليل الاستثمار لفرص المشاريع الجديدة.",
        department: "Investment",
        departmentAr: "الاستثمار",
        type: "full-time",
        location: "Riyadh",
        requirements: "Bachelor's in Finance/Economics, 3+ years experience, CFA preferred",
        requirementsAr: "بكالوريوس في المالية أو الاقتصاد، خبرة 3+ سنوات، يُفضل حاملي شهادة CFA",
        active: true,
      },
      {
        title: "Marketing Manager",
        titleAr: "مدير تسويق",
        description: "Lead the marketing strategy for Nawa's premium developments including digital, events, and brand campaigns.",
        descriptionAr: "قيادة الاستراتيجية التسويقية لمشاريع نوى الفاخرة بما يشمل التسويق الرقمي والفعاليات وحملات العلامة التجارية.",
        department: "Marketing",
        departmentAr: "التسويق",
        type: "full-time",
        location: "Riyadh",
        requirements: "7+ years marketing experience, luxury brand background preferred",
        requirementsAr: "خبرة 7+ سنوات في التسويق، يُفضل خلفية في العلامات التجارية الفاخرة",
        active: true,
      },
    ]);
    console.log("✓ Jobs seeded");
  }

  // Brokers
  const existingBrokers = await db.select().from(brokersTable);
  if (existingBrokers.length === 0) {
    await db.insert(brokersTable).values([
      {
        name: "Abdullah Al-Qahtani",
        nameAr: "عبدالله القحطاني",
        email: "abdullah.q@nawainv.sa",
        phone: "+966 50 111 2233",
        specialization: "Luxury Residential",
        specializationAr: "العقارات السكنية الفاخرة",
        bio: "15+ years of experience in premium real estate, specializing in high-net-worth client portfolios.",
        bioAr: "أكثر من 15 عاماً في العقارات الفاخرة، متخصص في محافظ العملاء ذوي الثروات العالية.",
        rating: 4.9,
        dealsCount: 247,
        active: true,
      },
      {
        name: "Fatima Al-Zahrawi",
        nameAr: "فاطمة الزهراوي",
        email: "fatima.z@nawainv.sa",
        phone: "+966 55 222 3344",
        specialization: "Commercial Properties",
        specializationAr: "العقارات التجارية",
        bio: "Expert in commercial real estate transactions and corporate leasing solutions.",
        bioAr: "خبيرة في صفقات العقارات التجارية وحلول التأجير للشركات.",
        rating: 4.8,
        dealsCount: 189,
        active: true,
      },
      {
        name: "Khalid Al-Mutairi",
        nameAr: "خالد المطيري",
        email: "khalid.m@nawainv.sa",
        phone: "+966 54 333 4455",
        specialization: "Investment Properties",
        specializationAr: "العقارات الاستثمارية",
        bio: "Certified investment advisor with deep expertise in off-plan developments and ROI optimization.",
        bioAr: "مستشار استثمار معتمد بخبرة عميقة في مشاريع الخطة وتحسين العائد على الاستثمار.",
        rating: 4.7,
        dealsCount: 312,
        active: true,
      },
    ]);
    console.log("✓ Brokers seeded");
  }

  // Board Members
  const existingBoard = await db.select().from(boardMembersTable);
  if (existingBoard.length === 0) {
    await db.insert(boardMembersTable).values([
      {
        name: "Prince Faisal Al-Nawa",
        nameAr: "الأمير فيصل النوى",
        position: "Chairman of the Board",
        positionAr: "رئيس مجلس الإدارة",
        bio: "A visionary leader with over 30 years of experience in real estate development and investment across the GCC region.",
        bioAr: "قائد ذو رؤية استراتيجية بخبرة تمتد لأكثر من 30 عاماً في تطوير العقارات والاستثمار في منطقة الخليج العربي.",
        order: 1,
      },
      {
        name: "Dr. Mohammed Al-Harbi",
        nameAr: "د. محمد الحربي",
        position: "Vice Chairman & CEO",
        positionAr: "نائب رئيس مجلس الإدارة والرئيس التنفيذي",
        bio: "PhD in Urban Planning from MIT, former senior advisor to Saudi Ministry of Housing. Architect of Nawa's Vision 2030 strategy.",
        bioAr: "دكتوراه في التخطيط العمراني من معهد MIT، مستشار أول سابق لوزارة الإسكان السعودية. مهندس استراتيجية رؤية 2030 لنوى.",
        order: 2,
      },
      {
        name: "Eng. Saad Al-Dawoud",
        nameAr: "م. سعد الداود",
        position: "Board Member & Chief Development Officer",
        positionAr: "عضو مجلس الإدارة ورئيس التطوير",
        bio: "Engineer with 25+ years specializing in mega-project delivery, having overseen SAR 12 billion in completed developments.",
        bioAr: "مهندس بخبرة 25+ عاماً متخصص في تنفيذ المشاريع الكبرى، أشرف على مشاريع مكتملة بقيمة 12 مليار ريال.",
        order: 3,
      },
      {
        name: "Nora Al-Rasheed",
        nameAr: "نورة الراشد",
        position: "Board Member & Chief Financial Officer",
        positionAr: "عضو مجلس الإدارة والرئيس المالي",
        bio: "CFA charterholder and investment banking veteran with 20 years of experience in structured real estate finance.",
        bioAr: "حاملة شهادة CFA، بخلفية في الخدمات المصرفية الاستثمارية وخبرة 20 عاماً في التمويل العقاري المهيكل.",
        order: 4,
      },
    ]);
    console.log("✓ Board members seeded");
  }

  // Conversations
  const existingConvs = await db.select().from(conversationsTable);
  if (existingConvs.length === 0) {
    await db.insert(conversationsTable).values([
      {
        title: "General - نوى",
        isGroup: true,
        participants: "[]",
        lastMessage: "Welcome to Nawa internal chat!",
        unreadCount: 0,
      },
    ]);
    console.log("✓ Conversations seeded");
  }

  console.log("\n✓ Database seeding complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
