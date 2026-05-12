import { connectDb, User, Project, Service, News, Job, Broker, BoardMember, Conversation } from "@workspace/db";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Connecting to MongoDB...");
  await connectDb();
  console.log("Seeding database...");

  if ((await User.countDocuments()) === 0) {
    const envPassword = process.env.SEED_ADMIN_PASSWORD?.trim();
    if (process.env.NODE_ENV === "production" && !envPassword) {
      throw new Error(
        "Refusing to seed default credentials in production. Set SEED_ADMIN_PASSWORD env var to a strong password.",
      );
    }
    const plainPassword = envPassword || "admin123";
    if (!envPassword) {
      console.warn("⚠ Using default dev password 'admin123'. Set SEED_ADMIN_PASSWORD for any non-local use.");
    }
    const adminPassword = await bcrypt.hash(plainPassword, 12);
    await User.insertMany([
      { name: "Admin Nawa", nameAr: "مدير نوى", email: "admin@nawainv.sa", password: adminPassword, role: "super_admin", department: "Management", active: true },
      { name: "Ahmed Al-Rashid", nameAr: "أحمد الراشد", email: "ahmed@nawainv.sa", password: adminPassword, role: "manager", department: "Sales", active: true },
      { name: "Sara Al-Khalid", nameAr: "سارة الخالد", email: "sara@nawainv.sa", password: adminPassword, role: "content_manager", department: "Marketing", active: true },
      { name: "CEO Nawa", nameAr: "الرئيس التنفيذي", email: "ceo@nawainv.sa", password: adminPassword, role: "super_admin", department: "Executive", active: true, emailAccount: "ceo@nawainv.sa" },
    ]);
    console.log("✓ Users seeded");
  }

  if ((await Project.countDocuments()) === 0) {
    await Project.insertMany([
      {
        title: "Nawa Skyline Tower",
        titleAr: "برج نوى سكايلاين",
        description: "A landmark mixed-use development in the heart of Riyadh, featuring premium residential units and Class A office spaces.",
        descriptionAr: "مشروع متكامل متعدد الاستخدامات في قلب الرياض، يضم وحدات سكنية فاخرة ومكاتب تجارية من الدرجة الأولى.",
        location: "Riyadh, King Fahd Road",
        locationAr: "الرياض، طريق الملك فهد",
        status: "active", type: "mixed-use",
        totalUnits: 240, availableUnits: 87, completionPercentage: 65,
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
        status: "active", type: "residential",
        totalUnits: 120, availableUnits: 45, completionPercentage: 80,
        featured: true,
        price: "Starting from SAR 3,500,000",
        area: "400 - 800 m²",
      },
      {
        title: "Nawa Business Park",
        titleAr: "حديقة نوى للأعمال",
        description: "A modern Grade-A office park designed for multinational HQs and innovative SMEs in Riyadh's business district.",
        descriptionAr: "مجمع مكاتب من الدرجة الأولى مصمم لمقرات الشركات العالمية والشركات المبتكرة في حي الأعمال بالرياض.",
        location: "Riyadh, KAFD",
        locationAr: "الرياض، مركز الملك عبدالله المالي",
        status: "planning", type: "commercial",
        totalUnits: 60, availableUnits: 60, completionPercentage: 25,
        featured: false,
        price: "Lease from SAR 1,800/m²/yr",
        area: "200 - 5,000 m²",
      },
      {
        title: "Nawa Coastal Residences",
        titleAr: "إقامات نوى الساحلية",
        description: "Beachfront luxury apartments with panoramic Red Sea views in Al-Khobar's premier waterfront.",
        descriptionAr: "شقق فاخرة على الواجهة البحرية بإطلالات بانورامية على البحر الأحمر في أرقى واجهات الخبر.",
        location: "Al-Khobar Corniche",
        locationAr: "كورنيش الخبر",
        status: "active", type: "residential",
        totalUnits: 180, availableUnits: 120, completionPercentage: 40,
        featured: true,
        price: "Starting from SAR 2,100,000",
        area: "150 - 380 m²",
      },
    ]);
    console.log("✓ Projects seeded");
  }

  if ((await Service.countDocuments()) === 0) {
    await Service.insertMany([
      { title: "Real Estate Development", titleAr: "تطوير عقاري", description: "Master-planned community development from acquisition to handover.", descriptionAr: "تطوير مجتمعات متكاملة من التملك حتى التسليم.", icon: "Building2", order: 1 },
      { title: "Investment Advisory", titleAr: "استشارات استثمارية", description: "Data-driven strategies for institutional and private investors.", descriptionAr: "استراتيجيات مدروسة للمستثمرين الأفراد والمؤسسات.", icon: "TrendingUp", order: 2 },
      { title: "Property Management", titleAr: "إدارة الأملاك", description: "End-to-end property management for residential and commercial assets.", descriptionAr: "إدارة شاملة للعقارات السكنية والتجارية.", icon: "Briefcase", order: 3 },
      { title: "Brokerage Services", titleAr: "خدمات الوساطة", description: "Licensed brokerage for buying, selling, and leasing premium properties.", descriptionAr: "وساطة مرخصة لشراء وبيع وتأجير العقارات المميزة.", icon: "HandshakeIcon", order: 4 },
      { title: "Market Research", titleAr: "أبحاث السوق", description: "In-depth Saudi real estate market intelligence and feasibility studies.", descriptionAr: "أبحاث متعمقة لسوق العقار السعودي ودراسات الجدوى.", icon: "BarChart3", order: 5 },
      { title: "Project Marketing", titleAr: "تسويق المشاريع", description: "Integrated marketing campaigns for off-plan and ready properties.", descriptionAr: "حملات تسويقية متكاملة للمشاريع على الخارطة والجاهزة.", icon: "Megaphone", order: 6 },
    ]);
    console.log("✓ Services seeded");
  }

  if ((await News.countDocuments()) === 0) {
    await News.insertMany([
      { title: "Nawa Launches Skyline Tower in Riyadh", titleAr: "نوى تطلق برج سكايلاين في الرياض", content: "Nawa Real Estate is proud to announce the official launch of Nawa Skyline Tower, a SAR 2.4 billion landmark development in the heart of Riyadh.", contentAr: "تفخر نوى العقارية بإعلان الإطلاق الرسمي لبرج نوى سكايلاين، مشروع معماري بقيمة 2.4 مليار ريال في قلب الرياض.", category: "announcement", featured: true, publishedAt: new Date() },
      { title: "Nawa Partners with Vision 2030 Initiative", titleAr: "نوى تعقد شراكة مع مبادرة رؤية 2030", content: "Nawa Real Estate has signed a strategic partnership agreement to support Saudi Arabia's Vision 2030 housing program.", contentAr: "وقعت نوى العقارية اتفاقية شراكة استراتيجية لدعم برنامج الإسكان ضمن رؤية المملكة 2030.", category: "press-release", featured: true, publishedAt: new Date() },
      { title: "Q3 Market Report: Riyadh Premium Properties Up 12%", titleAr: "تقرير الربع الثالث: العقارات الفاخرة في الرياض ترتفع 12%", content: "Our latest market analysis shows continued strong growth in Riyadh's premium real estate segment.", contentAr: "يُظهر تحليلنا الأخير للسوق نمواً قوياً متواصلاً في قطاع العقارات الفاخرة بالرياض.", category: "news", featured: false, publishedAt: new Date() },
    ]);
    console.log("✓ News seeded");
  }

  if ((await Job.countDocuments()) === 0) {
    await Job.insertMany([
      { title: "Senior Real Estate Investment Analyst", titleAr: "محلل استثمار عقاري أول", description: "Lead financial modeling and feasibility studies for major developments.", descriptionAr: "قيادة النمذجة المالية ودراسات الجدوى للمشاريع الكبرى.", department: "Investment", departmentAr: "الاستثمار", type: "full-time", location: "Riyadh", requirements: "5+ years experience, CFA preferred, fluent Arabic & English", requirementsAr: "خبرة 5+ سنوات، شهادة CFA مفضلة، إجادة العربية والإنجليزية", active: true },
      { title: "Project Development Manager", titleAr: "مدير تطوير مشاريع", description: "Oversee end-to-end delivery of mixed-use developments.", descriptionAr: "الإشراف على التنفيذ الكامل للمشاريع متعددة الاستخدامات.", department: "Development", departmentAr: "التطوير", type: "full-time", location: "Riyadh", requirements: "10+ years in real estate development, PMP certification", requirementsAr: "خبرة 10+ سنوات في تطوير العقار، شهادة PMP", active: true },
      { title: "Marketing Specialist", titleAr: "أخصائي تسويق", description: "Develop and execute marketing strategies for premium projects.", descriptionAr: "تطوير وتنفيذ استراتيجيات تسويق للمشاريع الفاخرة.", department: "Marketing", departmentAr: "التسويق", type: "full-time", location: "Jeddah", requirements: "3+ years digital marketing experience", requirementsAr: "خبرة 3+ سنوات في التسويق الرقمي", active: true },
    ]);
    console.log("✓ Jobs seeded");
  }

  if ((await Broker.countDocuments()) === 0) {
    await Broker.insertMany([
      { name: "Mohammed Al-Otaibi", nameAr: "محمد العتيبي", email: "mohammed.o@nawainv.sa", phone: "+966 50 111 2233", specialization: "Luxury Residential", specializationAr: "السكني الفاخر", bio: "Over 15 years closing premium residential deals across Riyadh and Jeddah.", bioAr: "أكثر من 15 عاماً في إبرام صفقات سكنية فاخرة بالرياض وجدة.", rating: 4.9, dealsCount: 247, active: true },
      { name: "Fatima Al-Zahrawi", nameAr: "فاطمة الزهراوي", email: "fatima.z@nawainv.sa", phone: "+966 55 222 3344", specialization: "Commercial Properties", specializationAr: "العقارات التجارية", bio: "Expert in commercial real estate transactions and corporate leasing solutions.", bioAr: "خبيرة في صفقات العقارات التجارية وحلول التأجير للشركات.", rating: 4.8, dealsCount: 189, active: true },
      { name: "Khalid Al-Mutairi", nameAr: "خالد المطيري", email: "khalid.m@nawainv.sa", phone: "+966 54 333 4455", specialization: "Investment Properties", specializationAr: "العقارات الاستثمارية", bio: "Certified investment advisor with deep expertise in off-plan developments and ROI optimization.", bioAr: "مستشار استثمار معتمد بخبرة عميقة في مشاريع الخطة وتحسين العائد على الاستثمار.", rating: 4.7, dealsCount: 312, active: true },
    ]);
    console.log("✓ Brokers seeded");
  }

  if ((await BoardMember.countDocuments()) === 0) {
    await BoardMember.insertMany([
      { name: "Prince Faisal Al-Nawa", nameAr: "الأمير فيصل النوى", position: "Chairman of the Board", positionAr: "رئيس مجلس الإدارة", bio: "A visionary leader with over 30 years of experience in real estate development and investment across the GCC region.", bioAr: "قائد ذو رؤية استراتيجية بخبرة تمتد لأكثر من 30 عاماً في تطوير العقارات والاستثمار في منطقة الخليج العربي.", order: 1 },
      { name: "Dr. Mohammed Al-Harbi", nameAr: "د. محمد الحربي", position: "Vice Chairman & CEO", positionAr: "نائب رئيس مجلس الإدارة والرئيس التنفيذي", bio: "PhD in Urban Planning from MIT, former senior advisor to Saudi Ministry of Housing. Architect of Nawa's Vision 2030 strategy.", bioAr: "دكتوراه في التخطيط العمراني من معهد MIT، مستشار أول سابق لوزارة الإسكان السعودية. مهندس استراتيجية رؤية 2030 لنوى.", order: 2 },
      { name: "Eng. Saad Al-Dawoud", nameAr: "م. سعد الداود", position: "Board Member & Chief Development Officer", positionAr: "عضو مجلس الإدارة ورئيس التطوير", bio: "Engineer with 25+ years specializing in mega-project delivery, having overseen SAR 12 billion in completed developments.", bioAr: "مهندس بخبرة 25+ عاماً متخصص في تنفيذ المشاريع الكبرى، أشرف على مشاريع مكتملة بقيمة 12 مليار ريال.", order: 3 },
      { name: "Nora Al-Rasheed", nameAr: "نورة الراشد", position: "Board Member & Chief Financial Officer", positionAr: "عضو مجلس الإدارة والرئيس المالي", bio: "CFA charterholder and investment banking veteran with 20 years of experience in structured real estate finance.", bioAr: "حاملة شهادة CFA، بخلفية في الخدمات المصرفية الاستثمارية وخبرة 20 عاماً في التمويل العقاري المهيكل.", order: 4 },
    ]);
    console.log("✓ Board members seeded");
  }

  if ((await Conversation.countDocuments()) === 0) {
    await Conversation.create({
      title: "General - نوى",
      isGroup: true,
      participants: [],
      lastMessage: "Welcome to Nawa internal chat!",
      unreadCount: 0,
    });
    console.log("✓ Conversations seeded");
  }

  console.log("\n✓ Database seeding complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
