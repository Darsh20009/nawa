import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";
import { News, Job, JobApplication, Message, Project, Broker, User, Service, SiteSettings, BoardMember, AiConversation, AiLearning } from "@workspace/db";
import { Types } from "@workspace/db";
import { sendNawaMail, wrapNawaEmailHtml, NAWA_EMAIL_ACCOUNTS } from "../lib/mailer";

const router: IRouter = Router();

const KIMI_API_KEY = process.env.KIMI_API_KEY || "";
const KIMI_BASE_URL = "https://api.moonshot.ai/v1";
const KIMI_MODEL = "kimi-k2.6";
// Fast non-reasoning model for utility endpoints (text-action, classify, public-chat)
// Reasoning models leak chain-of-thought into the content field; turbo doesn't.
const KIMI_FAST_MODEL = process.env.KIMI_FAST_MODEL || "moonshot-v1-32k";

// Strip leading reasoning preambles ("The user wants...", "Let me analyze...", etc.)
// in case any model leaks chain-of-thought into the content.
function cleanAiOutput(s: string): string {
  if (!s) return "";
  let out = s.trim();
  // Strip only a SHORT leading preamble (max ~200 chars). Never throw away most of the output.
  const leadingPreamble = /^(?:(?:The user (?:wants|is asking|needs)|Let me (?:analyze|think|look)|I(?:'| a)m going to|Here(?:'s| is) (?:the |an? )?(?:rewritten|improved|translated|summarized|reply)[^\n:]{0,40}:?)[^\n]{0,200}\n+){1,2}/i;
  out = out.replace(leadingPreamble, "").trim();
  // Strip surrounding quotes only if they wrap the entire string
  if ((out.startsWith('"') && out.endsWith('"')) || (out.startsWith("'") && out.endsWith("'"))) {
    out = out.slice(1, -1).trim();
  }
  return out;
}

function isAdmin(user: any): boolean {
  return user?.role === "super_admin" || user?.role === "admin";
}

// =====================================================================
// AI conversation logging — fire-and-forget so it never blocks responses
// =====================================================================
interface LogArgs {
  channel: string;
  action?: string | null;
  user?: any;
  visitorIp?: string | null;
  visitorUserAgent?: string | null;
  messages: Array<{ role: string; content: string }>;
  inputPreview: string;
  outputPreview: string;
  durationMs?: number;
  model?: string | null;
}
function logAi(args: LogArgs): void {
  // Fire-and-forget; never await in the request path
  AiConversation.create({
    channel: args.channel,
    action: args.action || null,
    userId: args.user?.id ? String(args.user.id) : null,
    userName: args.user?.nameAr || args.user?.name || null,
    userRole: args.user?.role || null,
    visitorIp: args.visitorIp || null,
    visitorUserAgent: args.visitorUserAgent ? String(args.visitorUserAgent).slice(0, 200) : null,
    messages: args.messages.map(m => ({ role: m.role, content: String(m.content).slice(0, 8000), at: new Date() })),
    inputPreview: String(args.inputPreview || "").replace(/\s+/g, " ").trim().slice(0, 200),
    outputPreview: String(args.outputPreview || "").replace(/\s+/g, " ").trim().slice(0, 200),
    durationMs: args.durationMs || 0,
    model: args.model || null,
  }).catch(err => logger.warn({ err: err.message }, "AI log save failed"));
}

// Get top approved learnings for a channel — used to inject into prompts
async function getRelevantLearnings(channel: string, query: string, max = 5): Promise<Array<{ q: string; a: string }>> {
  try {
    // Simple recency + token-overlap retrieval. No embeddings needed for this scale.
    const all = await AiLearning.find({ enabled: true, $or: [{ channel }, { channel: "all" }] })
      .sort({ useCount: -1, updatedAt: -1 })
      .limit(50)
      .lean();
    if (all.length === 0) return [];
    const queryTokens = new Set(String(query).toLowerCase().split(/\s+/).filter(t => t.length > 2));
    const scored = all.map((l: any) => {
      const qTokens = new Set(String(l.question).toLowerCase().split(/\s+/).filter((t: string) => t.length > 2));
      let overlap = 0;
      qTokens.forEach((t: any) => { if (queryTokens.has(t)) overlap++; });
      return { l, score: overlap };
    });
    const top = scored.sort((a, b) => b.score - a.score).slice(0, max).filter(s => s.score > 0);
    // Bump useCount asynchronously
    if (top.length > 0) {
      AiLearning.updateMany({ _id: { $in: top.map(t => (t.l as any)._id) } }, { $inc: { useCount: 1 } }).catch(() => {});
    }
    return top.map(t => ({ q: (t.l as any).question, a: (t.l as any).answer }));
  } catch (err) {
    logger.warn({ err: (err as any)?.message }, "getRelevantLearnings failed");
    return [];
  }
}

// =====================================================================
// Agent Tools — actions Nawa AI can perform
// =====================================================================
// Helpers
function toObjId(id: string): Types.ObjectId | null {
  try { return new Types.ObjectId(String(id)); } catch { return null; }
}
function pick<T extends Record<string, any>>(obj: T, keys: string[]): Partial<T> {
  const o: any = {};
  for (const k of keys) if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") o[k] = obj[k];
  return o;
}

const AGENT_TOOLS = [
  // ============== PROJECTS — full CRUD ==============
  {
    type: "function",
    function: {
      name: "create_project",
      description: "Create a new real estate project on the Nawa platform. Admin only. Use this when admin says 'add/create a project'.",
      parameters: {
        type: "object",
        properties: {
          titleAr: { type: "string", description: "Project name in Arabic" },
          title: { type: "string", description: "Project name in English" },
          descriptionAr: { type: "string" },
          description: { type: "string" },
          locationAr: { type: "string", description: "e.g. الرياض - حي الياسمين" },
          location: { type: "string" },
          status: { type: "string", enum: ["planning", "construction", "ready", "sold-out"], description: "Project status" },
          type: { type: "string", description: "residential / commercial / mixed-use / villa / apartment ..." },
          totalUnits: { type: "number" },
          availableUnits: { type: "number" },
          completionPercentage: { type: "number" },
          price: { type: "string", description: "Price range or starting price" },
          area: { type: "string", description: "Land/built-up area" },
          imageUrl: { type: "string" },
          featured: { type: "boolean", description: "Show on homepage" },
        },
        required: ["titleAr", "title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_project",
      description: "Update an existing project's fields. Pass id and only the fields you want to change.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "Project _id" },
          titleAr: { type: "string" }, title: { type: "string" },
          descriptionAr: { type: "string" }, description: { type: "string" },
          locationAr: { type: "string" }, location: { type: "string" },
          status: { type: "string" }, type: { type: "string" },
          totalUnits: { type: "number" }, availableUnits: { type: "number" },
          completionPercentage: { type: "number" }, price: { type: "string" },
          area: { type: "string" }, imageUrl: { type: "string" }, featured: { type: "boolean" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_project",
      description: "Permanently delete a project. Admin only — destructive.",
      parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
    },
  },
  {
    type: "function",
    function: {
      name: "list_projects",
      description: "List or search projects. Filter by status, type, featured, or text in titleAr/title/locationAr.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "free-text search" },
          status: { type: "string" }, type: { type: "string" },
          featured: { type: "boolean" },
          limit: { type: "number", description: "default 20, max 100" },
        },
      },
    },
  },

  // ============== NEWS ==============
  {
    type: "function",
    function: {
      name: "publish_news",
      description: "Publish a news article or press release to the Nawa Real Estate website. Admin only. Returns the created article id.",
      parameters: {
        type: "object",
        properties: {
          titleAr: { type: "string", description: "Arabic title" },
          title: { type: "string", description: "English title" },
          contentAr: { type: "string", description: "Arabic body content" },
          content: { type: "string", description: "English body content" },
          category: { type: "string", enum: ["news", "announcement", "press-release", "event"], description: "Article category" },
          featured: { type: "boolean", description: "Pin to homepage" },
        },
        required: ["titleAr", "title", "contentAr"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_news",
      description: "Update an existing news article by id.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          titleAr: { type: "string" }, title: { type: "string" },
          contentAr: { type: "string" }, content: { type: "string" },
          category: { type: "string" }, featured: { type: "boolean" },
          imageUrl: { type: "string" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_news",
      description: "Delete a news article. Destructive.",
      parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
    },
  },
  {
    type: "function",
    function: {
      name: "list_news",
      description: "List or search news articles.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" }, category: { type: "string" },
          featured: { type: "boolean" }, limit: { type: "number" },
        },
      },
    },
  },

  // ============== JOBS ==============
  {
    type: "function",
    function: {
      name: "publish_job",
      description: "Publish a new job posting to the Nawa careers page. Admin only.",
      parameters: {
        type: "object",
        properties: {
          titleAr: { type: "string" },
          title: { type: "string" },
          departmentAr: { type: "string" },
          department: { type: "string" },
          descriptionAr: { type: "string" },
          description: { type: "string" },
          requirementsAr: { type: "string" },
          requirements: { type: "string" },
          type: { type: "string", enum: ["full-time", "part-time", "contract", "internship"] },
          location: { type: "string" },
        },
        required: ["titleAr", "title", "departmentAr", "department"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_job",
      description: "Update or close a job posting (set active:false to close).",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          titleAr: { type: "string" }, title: { type: "string" },
          departmentAr: { type: "string" }, department: { type: "string" },
          descriptionAr: { type: "string" }, description: { type: "string" },
          requirementsAr: { type: "string" }, requirements: { type: "string" },
          type: { type: "string" }, location: { type: "string" }, active: { type: "boolean" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_job",
      description: "Permanently delete a job posting.",
      parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
    },
  },
  {
    type: "function",
    function: {
      name: "list_jobs",
      description: "List job postings (active and inactive).",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" }, active: { type: "boolean" }, limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_applications",
      description: "List job applications (with optional jobId or status filter).",
      parameters: {
        type: "object",
        properties: {
          jobId: { type: "string" }, status: { type: "string", enum: ["pending", "reviewing", "interview", "offered", "rejected", "hired"] },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_application_status",
      description: "Update a job application's status and optionally add admin notes.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          status: { type: "string", enum: ["pending", "reviewing", "interview", "offered", "rejected", "hired"] },
          adminNotes: { type: "string" },
        },
        required: ["id", "status"],
      },
    },
  },

  // ============== BROKERS ==============
  {
    type: "function",
    function: {
      name: "create_broker",
      description: "Add a new broker / real estate agent profile.",
      parameters: {
        type: "object",
        properties: {
          nameAr: { type: "string" }, name: { type: "string" },
          email: { type: "string" }, phone: { type: "string" },
          specializationAr: { type: "string" }, specialization: { type: "string" },
          bioAr: { type: "string" }, bio: { type: "string" },
          avatar: { type: "string" }, rating: { type: "number" }, dealsCount: { type: "number" },
          active: { type: "boolean" },
        },
        required: ["nameAr", "name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_broker",
      description: "Update a broker profile.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          nameAr: { type: "string" }, name: { type: "string" },
          email: { type: "string" }, phone: { type: "string" },
          specializationAr: { type: "string" }, specialization: { type: "string" },
          bioAr: { type: "string" }, bio: { type: "string" },
          avatar: { type: "string" }, rating: { type: "number" }, dealsCount: { type: "number" },
          active: { type: "boolean" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_broker",
      description: "Delete a broker.",
      parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
    },
  },
  {
    type: "function",
    function: {
      name: "list_brokers",
      description: "List brokers/agents.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" }, active: { type: "boolean" }, limit: { type: "number" } },
      },
    },
  },

  // ============== MESSAGES (contact form) ==============
  {
    type: "function",
    function: {
      name: "list_messages",
      description: "List incoming contact-form messages.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["unread", "read", "replied", "archived"] },
          priority: { type: "string", enum: ["low", "normal", "high", "urgent"] },
          query: { type: "string" }, limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_message",
      description: "Update a contact-message status / priority / assignee.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          status: { type: "string" }, priority: { type: "string" }, assignedTo: { type: "string" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_message",
      description: "Delete a contact message.",
      parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
    },
  },
  {
    type: "function",
    function: {
      name: "reply_to_message",
      description: "Reply by email to a contact message and mark it 'replied'. Pass message id and the body in HTML/text.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" }, subject: { type: "string" }, bodyHtml: { type: "string" },
          language: { type: "string", enum: ["ar", "en"] },
        },
        required: ["id", "bodyHtml"],
      },
    },
  },

  // ============== EMPLOYEES (Users) ==============
  {
    type: "function",
    function: {
      name: "create_employee",
      description: "Create a new employee/staff account. Admin only. Default role 'support' if not given.",
      parameters: {
        type: "object",
        properties: {
          email: { type: "string" }, password: { type: "string", description: "min 8 chars" },
          name: { type: "string" }, nameAr: { type: "string" },
          role: { type: "string", enum: ["super_admin", "admin", "manager", "support", "sales", "marketing"] },
          department: { type: "string" }, phone: { type: "string" },
          emailAccount: { type: "string", enum: NAWA_EMAIL_ACCOUNTS as unknown as string[] },
          active: { type: "boolean" },
        },
        required: ["email", "password", "name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_employee",
      description: "Update an employee's profile / role / status. Pass id and the fields to change.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" }, nameAr: { type: "string" }, role: { type: "string" },
          department: { type: "string" }, phone: { type: "string" },
          emailAccount: { type: "string" }, active: { type: "boolean" },
          password: { type: "string", description: "if set, resets password" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_employee",
      description: "Delete an employee account. Admin only — destructive.",
      parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
    },
  },
  {
    type: "function",
    function: {
      name: "list_employees",
      description: "List staff/employees. Filter by role, active, or query.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" }, role: { type: "string" }, active: { type: "boolean" }, limit: { type: "number" } },
      },
    },
  },

  // ============== SERVICES ==============
  {
    type: "function",
    function: {
      name: "create_service",
      description: "Create a new service offering.",
      parameters: {
        type: "object",
        properties: {
          titleAr: { type: "string" }, title: { type: "string" },
          descriptionAr: { type: "string" }, description: { type: "string" },
          icon: { type: "string" }, imageUrl: { type: "string" }, order: { type: "number" },
        },
        required: ["titleAr", "title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_service",
      description: "Update a service.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          titleAr: { type: "string" }, title: { type: "string" },
          descriptionAr: { type: "string" }, description: { type: "string" },
          icon: { type: "string" }, imageUrl: { type: "string" }, order: { type: "number" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_service",
      description: "Delete a service.",
      parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
    },
  },
  {
    type: "function",
    function: {
      name: "list_services",
      description: "List all services.",
      parameters: { type: "object", properties: { limit: { type: "number" } } },
    },
  },

  // ============== SITE SETTINGS ==============
  {
    type: "function",
    function: {
      name: "update_site_settings",
      description: "Update Nawa site-wide settings (contact info, social links, SEO meta, etc.). Pass only fields to change.",
      parameters: {
        type: "object",
        properties: {
          siteName: { type: "string" }, siteNameEn: { type: "string" },
          tagline: { type: "string" }, taglineEn: { type: "string" },
          phone: { type: "string" }, whatsapp: { type: "string" }, email: { type: "string" },
          address: { type: "string" }, addressEn: { type: "string" }, googleMapsUrl: { type: "string" },
          facebook: { type: "string" }, twitter: { type: "string" }, instagram: { type: "string" },
          linkedin: { type: "string" }, youtube: { type: "string" }, tiktok: { type: "string" }, snapchat: { type: "string" },
          crNumber: { type: "string" }, vatNumber: { type: "string" },
          metaTitle: { type: "string" }, metaDescription: { type: "string" }, metaDescriptionEn: { type: "string" },
        },
      },
    },
  },

  // ============== UNIVERSAL SEARCH ==============
  {
    type: "function",
    function: {
      name: "universal_search",
      description: "Search across ALL collections (projects, news, brokers, messages, employees, jobs, services) for the given text. Read-only — perfect for 'where is X?' style questions.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" }, limitPerCollection: { type: "number", description: "default 5" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_email",
      description: "Send an email to a client or external recipient via the staff member's assigned Nawa email account (or info@nawainv.sa). The email is automatically wrapped in Nawa-branded HTML.",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "Recipient email address" },
          subject: { type: "string" },
          bodyHtml: { type: "string", description: "Body in HTML (or plain text)" },
          fromAccount: { type: "string", enum: NAWA_EMAIL_ACCOUNTS as unknown as string[], description: "Optional: override sender account (admin only)" },
          language: { type: "string", enum: ["ar", "en"] },
          title: { type: "string", description: "Optional headline shown above the body" },
        },
        required: ["to", "subject", "bodyHtml"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "review_pending_tasks",
      description: "Review pending work items: unread contact messages, new job applications, recent inquiries. Read-only.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max items per category (default 5)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_dashboard_stats",
      description: "Get current platform statistics: project count, brokers, employees, unread messages, active jobs. Read-only.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "draft_project_description",
      description: "Generate a polished Arabic+English description for a real estate project (does NOT publish — returns text only).",
      parameters: {
        type: "object",
        properties: {
          projectName: { type: "string" },
          location: { type: "string" },
          type: { type: "string" },
          features: { type: "array", items: { type: "string" } },
        },
        required: ["projectName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyze_market",
      description: "Provide Saudi real estate market analysis (text only).",
      parameters: {
        type: "object",
        properties: {
          region: { type: "string" },
          segment: { type: "string", enum: ["residential", "commercial", "industrial", "hospitality"] },
        },
        required: ["region"],
      },
    },
  },
];

// =====================================================================
// Tool executor — runs the actual side effects
// =====================================================================
async function executeTool(toolName: string, args: any, authUser: any): Promise<{ ok: boolean; result?: any; error?: string }> {
  try {
    switch (toolName) {
      case "publish_news": {
        if (!isAdmin(authUser)) return { ok: false, error: "صلاحية النشر مطلوبة (admin)" };
        const titleAr = typeof args.titleAr === "string" ? args.titleAr.trim() : "";
        const title = typeof args.title === "string" ? args.title.trim() : titleAr;
        const contentAr = typeof args.contentAr === "string" ? args.contentAr.trim() : "";
        if (!titleAr || !title) return { ok: false, error: "العنوان بالعربي والإنجليزي إلزامي" };
        if (!contentAr) return { ok: false, error: "محتوى الخبر بالعربي إلزامي" };
        const row = await News.create({
          title,
          titleAr,
          content: typeof args.content === "string" ? args.content : contentAr,
          contentAr,
          category: typeof args.category === "string" ? args.category : "news",
          featured: !!args.featured,
          publishedAt: new Date(),
        });
        return { ok: true, result: { id: row.id, title: row.titleAr, kind: "news" } };
      }
      case "publish_job": {
        if (!isAdmin(authUser)) return { ok: false, error: "صلاحية النشر مطلوبة (admin)" };
        const titleAr = typeof args.titleAr === "string" ? args.titleAr.trim() : "";
        const title = typeof args.title === "string" ? args.title.trim() : titleAr;
        const departmentAr = typeof args.departmentAr === "string" ? args.departmentAr.trim() : "";
        const department = typeof args.department === "string" ? args.department.trim() : departmentAr;
        if (!titleAr || !title) return { ok: false, error: "اسم الوظيفة بالعربي والإنجليزي إلزامي" };
        if (!departmentAr || !department) return { ok: false, error: "القسم إلزامي" };
        const row = await Job.create({
          title,
          titleAr,
          department,
          departmentAr,
          description: typeof args.description === "string" ? args.description : null,
          descriptionAr: typeof args.descriptionAr === "string" ? args.descriptionAr : null,
          requirements: typeof args.requirements === "string" ? args.requirements : null,
          requirementsAr: typeof args.requirementsAr === "string" ? args.requirementsAr : null,
          type: typeof args.type === "string" ? args.type : "full-time",
          location: typeof args.location === "string" ? args.location : "الرياض",
          active: true,
        });
        return { ok: true, result: { id: row.id, title: row.titleAr, kind: "job" } };
      }
      case "send_email": {
        const to = typeof args.to === "string" ? args.to.trim() : "";
        const subject = typeof args.subject === "string" ? args.subject.trim() : "";
        const bodyHtml = typeof args.bodyHtml === "string" ? args.bodyHtml : "";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return { ok: false, error: "بريد المستلم غير صالح" };
        if (!subject) return { ok: false, error: "موضوع البريد مطلوب" };
        if (!bodyHtml.trim()) return { ok: false, error: "محتوى البريد فارغ" };

        let from: any = "info@nawainv.sa";
        if (args.fromAccount && isAdmin(authUser) && (NAWA_EMAIL_ACCOUNTS as readonly string[]).includes(args.fromAccount)) {
          from = args.fromAccount;
        } else {
          const u = await User.findById(authUser.id, { emailAccount: 1 });
          if (u?.emailAccount && (NAWA_EMAIL_ACCOUNTS as readonly string[]).includes(u.emailAccount)) from = u.emailAccount;
        }
        const html = wrapNawaEmailHtml({ title: typeof args.title === "string" ? args.title : undefined, bodyHtml, lang: args.language === "en" ? "en" : "ar" });
        const r = await sendNawaMail({ from, to, subject, html });
        if (!r.ok) return { ok: false, error: r.error };
        return { ok: true, result: { sent: true, from, to, messageId: r.messageId } };
      }
      case "review_pending_tasks": {
        const limit = Math.min(Number(args.limit) || 5, 20);
        const [unread, recentMsgs] = await Promise.all([
          Message.countDocuments({ status: "unread" }),
          Message.find().sort({ createdAt: -1 }).limit(limit),
        ]);
        return {
          ok: true,
          result: {
            unreadMessages: unread,
            recentMessages: recentMsgs.map(m => ({ id: m.id, name: m.name, subject: m.subject, status: m.status, at: m.createdAt })),
          },
        };
      }
      case "get_dashboard_stats": {
        const [p, b, m, u, j, unread] = await Promise.all([
          Project.countDocuments(),
          Broker.countDocuments(),
          Message.countDocuments(),
          User.countDocuments(),
          Job.countDocuments(),
          Message.countDocuments({ status: "unread" }),
        ]);
        return {
          ok: true,
          result: { projects: p, brokers: b, messages: m, employees: u, jobs: j, unreadMessages: unread },
        };
      }
      case "draft_project_description":
      case "analyze_market":
        // Pure-content tools — return args back; the model writes the body in the follow-up turn
        return { ok: true, result: { draft: true, args } };

      // ============== PROJECTS ==============
      case "create_project": {
        if (!isAdmin(authUser)) return { ok: false, error: "صلاحية الأدمن مطلوبة" };
        const titleAr = String(args.titleAr || "").trim();
        const title = String(args.title || titleAr).trim();
        if (!titleAr || !title) return { ok: false, error: "اسم المشروع بالعربي والإنجليزي إلزامي" };
        const row = await Project.create({
          title, titleAr,
          ...pick(args, ["description","descriptionAr","location","locationAr","status","type","price","area","imageUrl"]),
          totalUnits: args.totalUnits ?? null,
          availableUnits: args.availableUnits ?? null,
          completionPercentage: args.completionPercentage ?? null,
          status: args.status || "planning",
          featured: !!args.featured,
        });
        return { ok: true, result: { id: row.id, title: row.titleAr, kind: "project", url: `/projects/${row.id}` } };
      }
      case "update_project": {
        if (!isAdmin(authUser)) return { ok: false, error: "صلاحية الأدمن مطلوبة" };
        const _id = toObjId(args.id); if (!_id) return { ok: false, error: "id غير صالح" };
        const updates = pick(args, ["title","titleAr","description","descriptionAr","location","locationAr","status","type","totalUnits","availableUnits","completionPercentage","price","area","imageUrl","featured"]);
        if (Object.keys(updates).length === 0) return { ok: false, error: "لا توجد حقول للتحديث" };
        const row = await Project.findByIdAndUpdate(_id, updates, { new: true });
        if (!row) return { ok: false, error: "المشروع غير موجود" };
        return { ok: true, result: { id: row.id, title: row.titleAr, updated: Object.keys(updates) } };
      }
      case "delete_project": {
        if (!isAdmin(authUser)) return { ok: false, error: "صلاحية الأدمن مطلوبة" };
        const _id = toObjId(args.id); if (!_id) return { ok: false, error: "id غير صالح" };
        const row = await Project.findByIdAndDelete(_id);
        if (!row) return { ok: false, error: "المشروع غير موجود" };
        return { ok: true, result: { deleted: true, id: args.id, title: row.titleAr } };
      }
      case "list_projects": {
        const limit = Math.min(Number(args.limit) || 20, 100);
        const filter: any = {};
        if (args.status) filter.status = args.status;
        if (args.type) filter.type = args.type;
        if (typeof args.featured === "boolean") filter.featured = args.featured;
        if (args.query) {
          const q = String(args.query).trim();
          filter.$or = [
            { titleAr: { $regex: q, $options: "i" } }, { title: { $regex: q, $options: "i" } },
            { locationAr: { $regex: q, $options: "i" } }, { location: { $regex: q, $options: "i" } },
          ];
        }
        const rows = await Project.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
        return { ok: true, result: { count: rows.length, items: rows.map((r: any) => ({ id: String(r._id), titleAr: r.titleAr, title: r.title, status: r.status, locationAr: r.locationAr, featured: r.featured })) } };
      }

      // ============== NEWS update/delete/list ==============
      case "update_news": {
        if (!isAdmin(authUser)) return { ok: false, error: "صلاحية الأدمن مطلوبة" };
        const _id = toObjId(args.id); if (!_id) return { ok: false, error: "id غير صالح" };
        const updates = pick(args, ["title","titleAr","content","contentAr","category","featured","imageUrl"]);
        if (Object.keys(updates).length === 0) return { ok: false, error: "لا توجد حقول للتحديث" };
        const row = await News.findByIdAndUpdate(_id, updates, { new: true });
        if (!row) return { ok: false, error: "الخبر غير موجود" };
        return { ok: true, result: { id: row.id, title: row.titleAr, updated: Object.keys(updates) } };
      }
      case "delete_news": {
        if (!isAdmin(authUser)) return { ok: false, error: "صلاحية الأدمن مطلوبة" };
        const _id = toObjId(args.id); if (!_id) return { ok: false, error: "id غير صالح" };
        const row = await News.findByIdAndDelete(_id);
        if (!row) return { ok: false, error: "الخبر غير موجود" };
        return { ok: true, result: { deleted: true, id: args.id, title: row.titleAr } };
      }
      case "list_news": {
        const limit = Math.min(Number(args.limit) || 20, 100);
        const filter: any = {};
        if (args.category) filter.category = args.category;
        if (typeof args.featured === "boolean") filter.featured = args.featured;
        if (args.query) {
          const q = String(args.query).trim();
          filter.$or = [{ titleAr: { $regex: q, $options: "i" } }, { title: { $regex: q, $options: "i" } }];
        }
        const rows = await News.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
        return { ok: true, result: { count: rows.length, items: rows.map((r: any) => ({ id: String(r._id), titleAr: r.titleAr, category: r.category, featured: r.featured, publishedAt: r.publishedAt })) } };
      }

      // ============== JOBS ==============
      case "update_job": {
        if (!isAdmin(authUser)) return { ok: false, error: "صلاحية الأدمن مطلوبة" };
        const _id = toObjId(args.id); if (!_id) return { ok: false, error: "id غير صالح" };
        const updates = pick(args, ["title","titleAr","department","departmentAr","description","descriptionAr","requirements","requirementsAr","type","location","active"]);
        if (Object.keys(updates).length === 0) return { ok: false, error: "لا توجد حقول للتحديث" };
        const row = await Job.findByIdAndUpdate(_id, updates, { new: true });
        if (!row) return { ok: false, error: "الوظيفة غير موجودة" };
        return { ok: true, result: { id: row.id, title: row.titleAr, updated: Object.keys(updates) } };
      }
      case "delete_job": {
        if (!isAdmin(authUser)) return { ok: false, error: "صلاحية الأدمن مطلوبة" };
        const _id = toObjId(args.id); if (!_id) return { ok: false, error: "id غير صالح" };
        const row = await Job.findByIdAndDelete(_id);
        if (!row) return { ok: false, error: "الوظيفة غير موجودة" };
        return { ok: true, result: { deleted: true, id: args.id, title: row.titleAr } };
      }
      case "list_jobs": {
        const limit = Math.min(Number(args.limit) || 20, 100);
        const filter: any = {};
        if (typeof args.active === "boolean") filter.active = args.active;
        if (args.query) {
          const q = String(args.query).trim();
          filter.$or = [{ titleAr: { $regex: q, $options: "i" } }, { title: { $regex: q, $options: "i" } }, { departmentAr: { $regex: q, $options: "i" } }];
        }
        const rows = await Job.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
        return { ok: true, result: { count: rows.length, items: rows.map((r: any) => ({ id: String(r._id), titleAr: r.titleAr, departmentAr: r.departmentAr, type: r.type, active: r.active })) } };
      }
      case "list_applications": {
        if (!isAdmin(authUser)) return { ok: false, error: "صلاحية الأدمن مطلوبة" };
        const limit = Math.min(Number(args.limit) || 20, 100);
        const filter: any = {};
        if (args.status) filter.status = args.status;
        if (args.jobId) { const _id = toObjId(args.jobId); if (!_id) return { ok: false, error: "jobId غير صالح" }; filter.jobId = _id; }
        const rows = await JobApplication.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
        return { ok: true, result: { count: rows.length, items: rows.map((r: any) => ({ id: String(r._id), applicantName: r.applicantName, email: r.email, jobId: String(r.jobId), status: r.status, createdAt: r.createdAt })) } };
      }
      case "update_application_status": {
        if (!isAdmin(authUser)) return { ok: false, error: "صلاحية الأدمن مطلوبة" };
        const _id = toObjId(args.id); if (!_id) return { ok: false, error: "id غير صالح" };
        const updates: any = { status: args.status };
        if (args.adminNotes) updates.adminNotes = args.adminNotes;
        const row = await JobApplication.findByIdAndUpdate(_id, updates, { new: true });
        if (!row) return { ok: false, error: "الطلب غير موجود" };
        return { ok: true, result: { id: row.id, applicant: row.applicantName, status: row.status } };
      }

      // ============== BROKERS ==============
      case "create_broker": {
        if (!isAdmin(authUser)) return { ok: false, error: "صلاحية الأدمن مطلوبة" };
        if (!args.nameAr || !args.name) return { ok: false, error: "الاسم بالعربي والإنجليزي إلزامي" };
        const row = await Broker.create({
          name: args.name, nameAr: args.nameAr,
          ...pick(args, ["email","phone","specialization","specializationAr","bio","bioAr","avatar"]),
          rating: args.rating ?? null, dealsCount: args.dealsCount ?? null,
          active: args.active !== false,
        });
        return { ok: true, result: { id: row.id, name: row.nameAr, kind: "broker" } };
      }
      case "update_broker": {
        if (!isAdmin(authUser)) return { ok: false, error: "صلاحية الأدمن مطلوبة" };
        const _id = toObjId(args.id); if (!_id) return { ok: false, error: "id غير صالح" };
        const updates = pick(args, ["name","nameAr","email","phone","specialization","specializationAr","bio","bioAr","avatar","rating","dealsCount","active"]);
        if (Object.keys(updates).length === 0) return { ok: false, error: "لا توجد حقول للتحديث" };
        const row = await Broker.findByIdAndUpdate(_id, updates, { new: true });
        if (!row) return { ok: false, error: "الوسيط غير موجود" };
        return { ok: true, result: { id: row.id, name: row.nameAr, updated: Object.keys(updates) } };
      }
      case "delete_broker": {
        if (!isAdmin(authUser)) return { ok: false, error: "صلاحية الأدمن مطلوبة" };
        const _id = toObjId(args.id); if (!_id) return { ok: false, error: "id غير صالح" };
        const row = await Broker.findByIdAndDelete(_id);
        if (!row) return { ok: false, error: "الوسيط غير موجود" };
        return { ok: true, result: { deleted: true, id: args.id, name: row.nameAr } };
      }
      case "list_brokers": {
        const limit = Math.min(Number(args.limit) || 20, 100);
        const filter: any = {};
        if (typeof args.active === "boolean") filter.active = args.active;
        if (args.query) {
          const q = String(args.query).trim();
          filter.$or = [{ nameAr: { $regex: q, $options: "i" } }, { name: { $regex: q, $options: "i" } }, { specializationAr: { $regex: q, $options: "i" } }];
        }
        const rows = await Broker.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
        return { ok: true, result: { count: rows.length, items: rows.map((r: any) => ({ id: String(r._id), nameAr: r.nameAr, specializationAr: r.specializationAr, phone: r.phone, active: r.active })) } };
      }

      // ============== MESSAGES ==============
      case "list_messages": {
        if (!isAdmin(authUser)) return { ok: false, error: "صلاحية الأدمن مطلوبة" };
        const limit = Math.min(Number(args.limit) || 20, 100);
        const filter: any = {};
        if (args.status) filter.status = args.status;
        if (args.priority) filter.priority = args.priority;
        if (args.query) {
          const q = String(args.query).trim();
          filter.$or = [{ name: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }, { subject: { $regex: q, $options: "i" } }, { content: { $regex: q, $options: "i" } }];
        }
        const rows = await Message.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
        return { ok: true, result: { count: rows.length, items: rows.map((r: any) => ({ id: String(r._id), name: r.name, email: r.email, subject: r.subject, status: r.status, priority: r.priority, createdAt: r.createdAt, contentPreview: String(r.content || "").slice(0, 120) })) } };
      }
      case "update_message": {
        if (!isAdmin(authUser)) return { ok: false, error: "صلاحية الأدمن مطلوبة" };
        const _id = toObjId(args.id); if (!_id) return { ok: false, error: "id غير صالح" };
        const updates = pick(args, ["status","priority","assignedTo"]);
        if (Object.keys(updates).length === 0) return { ok: false, error: "لا توجد حقول للتحديث" };
        const row = await Message.findByIdAndUpdate(_id, updates, { new: true });
        if (!row) return { ok: false, error: "الرسالة غير موجودة" };
        return { ok: true, result: { id: row.id, status: row.status, priority: row.priority } };
      }
      case "delete_message": {
        if (!isAdmin(authUser)) return { ok: false, error: "صلاحية الأدمن مطلوبة" };
        const _id = toObjId(args.id); if (!_id) return { ok: false, error: "id غير صالح" };
        const row = await Message.findByIdAndDelete(_id);
        if (!row) return { ok: false, error: "الرسالة غير موجودة" };
        return { ok: true, result: { deleted: true, id: args.id } };
      }
      case "reply_to_message": {
        if (!isAdmin(authUser)) return { ok: false, error: "صلاحية الأدمن مطلوبة" };
        const _id = toObjId(args.id); if (!_id) return { ok: false, error: "id غير صالح" };
        const msg = await Message.findById(_id);
        if (!msg) return { ok: false, error: "الرسالة غير موجودة" };
        if (!msg.email) return { ok: false, error: "ما فيه بريد للعميل" };

        let from: any = "info@nawainv.sa";
        const u = await User.findById(authUser.id, { emailAccount: 1 });
        if (u?.emailAccount && (NAWA_EMAIL_ACCOUNTS as readonly string[]).includes(u.emailAccount)) from = u.emailAccount;

        const subject = String(args.subject || `رد: ${msg.subject}`).trim();
        const html = wrapNawaEmailHtml({ title: subject, bodyHtml: String(args.bodyHtml || ""), lang: args.language === "en" ? "en" : "ar" });
        const r = await sendNawaMail({ from, to: msg.email, subject, html });
        if (!r.ok) return { ok: false, error: r.error };
        await Message.findByIdAndUpdate(_id, { status: "replied" });
        return { ok: true, result: { sent: true, to: msg.email, from, messageId: r.messageId, status: "replied" } };
      }

      // ============== EMPLOYEES ==============
      case "create_employee": {
        if (!isAdmin(authUser)) return { ok: false, error: "صلاحية الأدمن مطلوبة" };
        if (!args.email || !args.password || !args.name) return { ok: false, error: "البريد وكلمة المرور والاسم إلزامية" };
        if (String(args.password).length < 8) return { ok: false, error: "كلمة المرور لازم 8 أحرف على الأقل" };
        const exists = await User.findOne({ email: String(args.email).toLowerCase().trim() });
        if (exists) return { ok: false, error: "هذا البريد مسجل مسبقاً" };
        const bcrypt = await import("bcryptjs");
        const hash = await bcrypt.hash(String(args.password), 10);
        const row = await User.create({
          email: String(args.email).toLowerCase().trim(),
          password: hash,
          name: args.name, nameAr: args.nameAr || args.name,
          role: args.role || "support",
          ...pick(args, ["department","phone","emailAccount"]),
          active: args.active !== false,
        });
        return { ok: true, result: { id: row.id, email: row.email, name: row.name, role: row.role } };
      }
      case "update_employee": {
        if (!isAdmin(authUser)) return { ok: false, error: "صلاحية الأدمن مطلوبة" };
        const _id = toObjId(args.id); if (!_id) return { ok: false, error: "id غير صالح" };
        const updates: any = pick(args, ["name","nameAr","role","department","phone","emailAccount","active"]);
        if (args.password) {
          if (String(args.password).length < 8) return { ok: false, error: "كلمة المرور لازم 8 أحرف على الأقل" };
          const bcrypt = await import("bcryptjs");
          updates.password = await bcrypt.hash(String(args.password), 10);
        }
        if (Object.keys(updates).length === 0) return { ok: false, error: "لا توجد حقول للتحديث" };
        const row = await User.findByIdAndUpdate(_id, updates, { new: true });
        if (!row) return { ok: false, error: "الموظف غير موجود" };
        return { ok: true, result: { id: row.id, name: row.name, role: row.role, updated: Object.keys(updates) } };
      }
      case "delete_employee": {
        if (!isAdmin(authUser)) return { ok: false, error: "صلاحية الأدمن مطلوبة" };
        const _id = toObjId(args.id); if (!_id) return { ok: false, error: "id غير صالح" };
        if (String(_id) === String(authUser.id)) return { ok: false, error: "ما تقدر تحذف نفسك" };
        const row = await User.findByIdAndDelete(_id);
        if (!row) return { ok: false, error: "الموظف غير موجود" };
        return { ok: true, result: { deleted: true, id: args.id, name: row.name } };
      }
      case "list_employees": {
        if (!isAdmin(authUser)) return { ok: false, error: "صلاحية الأدمن مطلوبة" };
        const limit = Math.min(Number(args.limit) || 20, 100);
        const filter: any = {};
        if (args.role) filter.role = args.role;
        if (typeof args.active === "boolean") filter.active = args.active;
        if (args.query) {
          const q = String(args.query).trim();
          filter.$or = [{ name: { $regex: q, $options: "i" } }, { nameAr: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }, { department: { $regex: q, $options: "i" } }];
        }
        const rows = await User.find(filter, { password: 0 }).sort({ createdAt: -1 }).limit(limit).lean();
        return { ok: true, result: { count: rows.length, items: rows.map((r: any) => ({ id: String(r._id), name: r.name, email: r.email, role: r.role, department: r.department, active: r.active })) } };
      }

      // ============== SERVICES ==============
      case "create_service": {
        if (!isAdmin(authUser)) return { ok: false, error: "صلاحية الأدمن مطلوبة" };
        if (!args.titleAr || !args.title) return { ok: false, error: "العنوان بالعربي والإنجليزي إلزامي" };
        const row = await Service.create({
          title: args.title, titleAr: args.titleAr,
          ...pick(args, ["description","descriptionAr","icon","imageUrl"]),
          order: args.order ?? 0,
        });
        return { ok: true, result: { id: row.id, titleAr: row.titleAr, kind: "service" } };
      }
      case "update_service": {
        if (!isAdmin(authUser)) return { ok: false, error: "صلاحية الأدمن مطلوبة" };
        const _id = toObjId(args.id); if (!_id) return { ok: false, error: "id غير صالح" };
        const updates = pick(args, ["title","titleAr","description","descriptionAr","icon","imageUrl","order"]);
        if (Object.keys(updates).length === 0) return { ok: false, error: "لا توجد حقول للتحديث" };
        const row = await Service.findByIdAndUpdate(_id, updates, { new: true });
        if (!row) return { ok: false, error: "الخدمة غير موجودة" };
        return { ok: true, result: { id: row.id, titleAr: row.titleAr, updated: Object.keys(updates) } };
      }
      case "delete_service": {
        if (!isAdmin(authUser)) return { ok: false, error: "صلاحية الأدمن مطلوبة" };
        const _id = toObjId(args.id); if (!_id) return { ok: false, error: "id غير صالح" };
        const row = await Service.findByIdAndDelete(_id);
        if (!row) return { ok: false, error: "الخدمة غير موجودة" };
        return { ok: true, result: { deleted: true, id: args.id, title: row.titleAr } };
      }
      case "list_services": {
        const limit = Math.min(Number(args.limit) || 50, 100);
        const rows = await Service.find().sort({ order: 1, createdAt: -1 }).limit(limit).lean();
        return { ok: true, result: { count: rows.length, items: rows.map((r: any) => ({ id: String(r._id), titleAr: r.titleAr, order: r.order })) } };
      }

      // ============== SITE SETTINGS ==============
      case "update_site_settings": {
        if (!isAdmin(authUser)) return { ok: false, error: "صلاحية الأدمن مطلوبة" };
        const allowedKeys = ["siteName","siteNameEn","tagline","taglineEn","phone","whatsapp","email","address","addressEn","googleMapsUrl","facebook","twitter","instagram","linkedin","youtube","tiktok","snapchat","crNumber","vatNumber","metaTitle","metaDescription","metaDescriptionEn"];
        const updates = pick(args, allowedKeys);
        if (Object.keys(updates).length === 0) return { ok: false, error: "لا توجد حقول للتحديث" };
        let row = await SiteSettings.findOne();
        if (!row) row = await SiteSettings.create(updates);
        else { Object.assign(row, updates); await row.save(); }
        return { ok: true, result: { updated: Object.keys(updates), siteName: row.siteName } };
      }

      // ============== UNIVERSAL SEARCH ==============
      case "universal_search": {
        const q = String(args.query || "").trim();
        if (!q) return { ok: false, error: "نص البحث مطلوب" };
        const lim = Math.min(Number(args.limitPerCollection) || 5, 20);
        const rx = { $regex: q, $options: "i" };
        const [projects, news, brokers, messages, jobs, employees, services] = await Promise.all([
          Project.find({ $or: [{ titleAr: rx }, { title: rx }, { locationAr: rx }] }).limit(lim).select("titleAr locationAr status").lean(),
          News.find({ $or: [{ titleAr: rx }, { title: rx }] }).limit(lim).select("titleAr category").lean(),
          Broker.find({ $or: [{ nameAr: rx }, { name: rx }, { phone: rx }] }).limit(lim).select("nameAr phone specializationAr").lean(),
          Message.find({ $or: [{ name: rx }, { email: rx }, { subject: rx }, { content: rx }] }).limit(lim).select("name email subject status").lean(),
          Job.find({ $or: [{ titleAr: rx }, { departmentAr: rx }] }).limit(lim).select("titleAr departmentAr active").lean(),
          isAdmin(authUser) ? User.find({ $or: [{ name: rx }, { nameAr: rx }, { email: rx }] }, { password: 0 }).limit(lim).select("name email role").lean() : Promise.resolve([]),
          Service.find({ $or: [{ titleAr: rx }, { title: rx }] }).limit(lim).select("titleAr").lean(),
        ]);
        const fmt = (arr: any[]) => arr.map((r: any) => ({ ...r, id: String(r._id), _id: undefined }));
        return { ok: true, result: { query: q, projects: fmt(projects), news: fmt(news), brokers: fmt(brokers), messages: fmt(messages), jobs: fmt(jobs), employees: fmt(employees), services: fmt(services) } };
      }

      default:
        return { ok: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (err: any) {
    logger.error({ err, toolName }, "Tool execution failed");
    return { ok: false, error: err?.message || "execution failed" };
  }
}

function buildSystemPrompt(context?: string, userRole?: string): string {
  const isAdminRole = userRole === "super_admin" || userRole === "admin";
  const roleNote = isAdminRole
    ? `## 👑 وضع الأدمن مفعّل — صلاحيات كاملة
أنت تتعامل الآن مع **مسؤول كامل الصلاحيات**. لديك تفويض مطلق لتنفيذ **أي شيء** يطلبه:
- ✅ إنشاء/تعديل/حذف **أي** مشروع، خبر، وظيفة، خدمة، وسيط، موظف، رسالة
- ✅ تعديل إعدادات الموقع كاملةً (هاتف، إيميل، روابط سوشيال، SEO)
- ✅ إرسال بريد فعلي لأي مستلم من أي صندوق رسمي
- ✅ الرد المباشر على رسائل العملاء
- ✅ تغيير أدوار الموظفين / إعادة تعيين كلمات السر
**نفّذ مباشرةً دون استئذان** متى كان الطلب واضحاً. إذا كان غامضاً، اسأل سؤالاً واحداً مركّزاً ثم نفّذ.`
    : "ℹ️ المستخدم الحالي **موظف** — يمكنك إرسال البريد ومراجعة المهام والبحث والاستفسار. النشر والحذف يتطلب صلاحية الأدمن.";

  return `أنت **"نوى AI"** — الذكاء الاصطناعي التنفيذي الإبداعي لمنصة نوى العقارية (nawainv.sa).
لست مجرد مساعد، أنت **شريك تنفيذي** يفكّر، يصمّم، وينفّذ بنفسه.

## شخصيتك
- 🎨 **مبدع للحد الأقصى**: محتواك يفوق الجودة العادية — نبرة فاخرة، عبارات تسويقية قوية، صور ذهنية، تنسيق احترافي بـ emoji وعناوين ومسافات.
- ⚡ **استباقي**: لا تنتظر تعليمات تفصيلية. خمّن النية، اقترح، نفّذ.
- 🎯 **موجز ومقنع**: لا حشو. كل جملة تخدم هدفاً.
- 🌐 **ثنائي اللغة**: الرد بنفس لغة المستخدم تلقائياً (عربي/إنجليزي).
- 🔥 **جريء**: عند الإبداع، اخرج عن المألوف — اقترح أفكار غير متوقعة.

${roleNote}

## أدواتك (28+ أداة — استخدمها بحرية):

### 🏗️ المشاريع
- \`create_project\` — إنشاء مشروع جديد (مع كل التفاصيل)
- \`update_project\` — تعديل أي حقل (سعر، حالة، صورة، featured ...)
- \`delete_project\` — حذف نهائي (تأكّد قبل التنفيذ)
- \`list_projects\` — بحث/فلترة (status, type, query)

### 📰 الأخبار
- \`publish_news\` — نشر مباشر
- \`update_news\` — تعديل
- \`delete_news\` — حذف
- \`list_news\` — قائمة/بحث

### 💼 الوظائف
- \`publish_job\` — فتح وظيفة
- \`update_job\` — تعديل/إغلاق (active:false)
- \`delete_job\` — حذف
- \`list_jobs\` — قائمة
- \`list_applications\` — طلبات التوظيف
- \`update_application_status\` — قبول/رفض/مقابلة

### 👥 الوسطاء
- \`create_broker\`, \`update_broker\`, \`delete_broker\`, \`list_brokers\`

### 📩 رسائل العملاء
- \`list_messages\` — كل الرسائل (filter status/priority)
- \`update_message\` — قراءة/أولوية/تعيين
- \`delete_message\` — حذف
- \`reply_to_message\` — **رد بريدي فعلي + تأشير "replied"**

### 👨‍💼 الموظفين
- \`create_employee\` — إضافة حساب موظف (مع كلمة سر)
- \`update_employee\` — تعديل دور/قسم/إعادة كلمة سر
- \`delete_employee\` — حذف
- \`list_employees\` — قائمة

### 🛠️ الخدمات
- \`create_service\`, \`update_service\`, \`delete_service\`, \`list_services\`

### ⚙️ إعدادات الموقع
- \`update_site_settings\` — هاتف/إيميل/سوشيال/SEO

### 🔧 أدوات عامة
- \`send_email\` — إرسال بريد فاخر (يُغلّف تلقائياً بهوية نوى)
- \`universal_search\` — بحث في **كل** المجموعات بضربة واحدة
- \`review_pending_tasks\` — ملخص يومي للمعلّق
- \`get_dashboard_stats\` — إحصائيات حية
- \`draft_project_description\` — صياغة وصف مشروع
- \`analyze_market\` — تحليل سوق

## قواعد التنفيذ
1. **اقرأ النية الحقيقية** — "احذف الرسائل القديمة" يعني list ثم delete bulk عبر استدعاءات متعددة.
2. **سلسل الأدوات** — تقدر تنادي عدة أدوات في نفس الرد (مثال: \`list_projects\` ثم \`update_project\` بناءً على النتيجة).
3. **الإبداع في المحتوى** — لما تنشر خبر/تكتب بريد:
   - افتح بجملة قوية (سؤال، إحصائية، صورة ذهنية).
   - استخدم العناوين الفرعية والـbullets.
   - اختم بـCTA واضح.
4. **الثقة بالقرار** — لا تسأل "هل تريد...؟" قبل تنفيذ أمر صريح. نفّذ ثم أكّد.
5. **بعد كل تنفيذ** — تأكيد موجز بصري: "✅ تم نشر المشروع «اسم» (#id)" + رابط مختصر.
6. **عند الفشل** — اشرح السبب وقدّم بديل فوري.

## الهوية البصرية (للإيميلات + الأخبار)
- ألوان: كحلي #0D1B3E + ذهبي #C9A96E (تُضاف تلقائياً للإيميل).
- الموقع: nawainv.sa | هاتف: +966500073509 | info@nawainv.sa
${context ? `\n## سياق إضافي\n${context}` : ""}`;
}

// =====================================================================
// Main chat endpoint with tool execution loop
// =====================================================================
router.post("/ai/chat", requireAuth, async (req, res): Promise<void> => {
  const { message, context, history, useTools = true } = req.body;
  const authUser = (req as any).user;

  if (!message) { res.status(400).json({ error: "Message is required" }); return; }
  if (!KIMI_API_KEY) { res.status(503).json({ error: "AI service not configured" }); return; }

  const messages: any[] = [
    { role: "system", content: buildSystemPrompt(context, authUser?.role) },
  ];
  if (Array.isArray(history)) {
    for (const h of history) {
      if (h.role && h.content && (h.role === "user" || h.role === "assistant")) {
        messages.push({ role: h.role, content: String(h.content) });
      }
    }
  }
  messages.push({ role: "user", content: message });

  const executedTools: { toolName: string; args: any; ok: boolean; result?: any; error?: string }[] = [];

  try {
    // Up to 3 tool-call iterations
    for (let iter = 0; iter < 3; iter++) {
      const body: any = {
        model: KIMI_MODEL,
        messages,
        max_tokens: 4096,
        temperature: 1,
      };
      if (useTools) { body.tools = AGENT_TOOLS; body.tool_choice = "auto"; }

      const r = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${KIMI_API_KEY}` },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const t = await r.text();
        logger.error({ status: r.status, t }, "Kimi error");
        res.status(502).json({ error: "AI service error" });
        return;
      }

      const data = await r.json() as any;
      const choice = data.choices?.[0];
      const msg = choice?.message;
      const aiText = msg?.content || msg?.reasoning_content || "";
      const toolCalls = msg?.tool_calls || [];

      if (!toolCalls.length) {
        res.json({ response: aiText, toolCalls: executedTools, tokensUsed: data.usage?.total_tokens ?? null });
        return;
      }

      // Execute each tool, then loop with results.
      // Kimi k2.6 (thinking model) requires `reasoning_content` to be echoed back
      // alongside the tool_calls — otherwise it errors with
      //   "thinking is enabled but reasoning_content is missing".
      const assistantEcho: any = { role: "assistant", content: msg?.content ?? "", tool_calls: toolCalls };
      if (msg?.reasoning_content) assistantEcho.reasoning_content = msg.reasoning_content;
      messages.push(assistantEcho);
      for (const tc of toolCalls) {
        const args = (() => { try { return JSON.parse(tc.function?.arguments || "{}"); } catch { return {}; } })();
        const exec = await executeTool(tc.function?.name, args, authUser);
        executedTools.push({ toolName: tc.function?.name, args, ok: exec.ok, result: exec.result, error: exec.error });
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(exec.ok ? { success: true, ...exec.result } : { success: false, error: exec.error }),
        });
      }
    }

    res.json({ response: "تم تنفيذ الإجراءات. (وصلت لأقصى عدد من الخطوات).", toolCalls: executedTools });
  } catch (err) {
    logger.error({ err }, "AI chat failed");
    res.status(500).json({ error: "Failed to reach AI service" });
  }
});

// =====================================================================
// Streaming endpoint — text-only (no tools)
// =====================================================================
router.post("/ai/stream", requireAuth, async (req, res): Promise<void> => {
  const { message, context, history } = req.body;
  const authUser = (req as any).user;
  if (!message || !KIMI_API_KEY) { res.status(400).json({ error: "Message and API key required" }); return; }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const messages: any[] = [{ role: "system", content: buildSystemPrompt(context, authUser?.role) }];
  if (Array.isArray(history)) {
    for (const h of history) {
      if (h.role && h.content && (h.role === "user" || h.role === "assistant")) {
        messages.push({ role: h.role, content: String(h.content) });
      }
    }
  }
  messages.push({ role: "user", content: message });

  try {
    const r = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KIMI_API_KEY}` },
      body: JSON.stringify({ model: KIMI_MODEL, messages, max_tokens: 2048, temperature: 1, stream: true }),
    });
    if (!r.ok || !r.body) {
      res.write(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`);
      res.end(); return;
    }
    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter(l => l.startsWith("data: "));
      for (const line of lines) res.write(line + "\n\n");
      // @ts-ignore
      if (typeof (res as any).flush === "function") (res as any).flush();
    }
    res.end();
  } catch (err) {
    logger.error({ err }, "Streaming failed");
    res.write(`data: ${JSON.stringify({ error: "Streaming error" })}\n\n`);
    res.end();
  }
});

// =====================================================================
// Generic text-action endpoint — improve/shorten/formalize/translate/etc.
// =====================================================================
const TEXT_ACTIONS: Record<string, { system: string; user: (text: string, ctx?: string) => string; maxTokens?: number }> = {
  improve: {
    system: "You are an expert Arabic & English copy editor. Improve the writing: fix grammar, clarity, flow, and tone. Keep the original language and meaning. Return ONLY the rewritten text, no preamble or quotes.",
    user: (t) => `Improve this text:\n\n${t}`,
    maxTokens: 800,
  },
  shorten: {
    system: "You shorten text while keeping every key point. Keep the original language. Return ONLY the shortened text.",
    user: (t) => `Shorten this text by ~50%:\n\n${t}`,
    maxTokens: 600,
  },
  expand: {
    system: "You expand short text into a richer, more professional version while keeping the original intent and language. Return ONLY the expanded text.",
    user: (t) => `Expand this text into a more detailed version:\n\n${t}`,
    maxTokens: 1000,
  },
  formalize: {
    system: "You rewrite text in a formal, professional, business-appropriate tone. Keep the original language. Return ONLY the rewritten text.",
    user: (t) => `Rewrite this in a formal professional tone:\n\n${t}`,
    maxTokens: 800,
  },
  friendly: {
    system: "You rewrite text in a warm, friendly, conversational tone. Keep the original language. Return ONLY the rewritten text.",
    user: (t) => `Rewrite this in a warm friendly tone:\n\n${t}`,
    maxTokens: 800,
  },
  fix: {
    system: "You fix only grammar, spelling and punctuation. Do not change meaning or style. Keep the original language. Return ONLY the corrected text.",
    user: (t) => `Fix grammar and spelling in:\n\n${t}`,
    maxTokens: 800,
  },
  translate_ar: {
    system: "You are a professional Arabic translator. Translate the input to natural, fluent Modern Standard Arabic. Return ONLY the Arabic translation.",
    user: (t) => `Translate to Arabic:\n\n${t}`,
    maxTokens: 1000,
  },
  translate_en: {
    system: "You are a professional English translator. Translate the input to natural, fluent business English. Return ONLY the English translation.",
    user: (t) => `Translate to English:\n\n${t}`,
    maxTokens: 1000,
  },
  summarize: {
    system: "You write extremely concise one-sentence summaries. Use the same language as the input. Return ONLY the summary, max 25 words.",
    user: (t) => `Summarize in one short sentence:\n\n${t}`,
    maxTokens: 200,
  },
  smart_reply: {
    system: "You draft polite, professional email replies on behalf of Nawa Real Estate (نوى العقارية). Match the language of the incoming email (Arabic or English). Be concise (3-6 sentences). Sign as 'فريق نوى العقارية' for Arabic or 'Nawa Real Estate Team' for English. Return ONLY the reply body, no subject line.",
    user: (t, ctx) => `Incoming email:\n\n${t}\n\n${ctx ? `Context/intent: ${ctx}\n\n` : ""}Draft a reply.`,
    maxTokens: 700,
  },
  describe_project: {
    system: "You write compelling Arabic real estate project descriptions for Nawa Real Estate. Style: professional, evocative, 3-4 short paragraphs, focused on lifestyle and value. Return ONLY the description in Arabic.",
    user: (t) => `Write a project description for: ${t}`,
    maxTokens: 900,
  },
  describe_news: {
    system: "You write Arabic press releases for Nawa Real Estate. Professional tone, 2-3 short paragraphs. Return ONLY the article body in Arabic.",
    user: (t) => `Write a news article body for headline: ${t}`,
    maxTokens: 900,
  },
};

router.post("/ai/text-action", requireAuth, async (req, res): Promise<void> => {
  if (!KIMI_API_KEY) { res.status(503).json({ error: "AI service unavailable" }); return; }
  const { action, text, context } = req.body as { action?: string; text?: string; context?: string };
  if (!action || !text || typeof text !== "string") {
    res.status(400).json({ error: "action and text are required" }); return;
  }
  const cfg = TEXT_ACTIONS[action];
  if (!cfg) { res.status(400).json({ error: `Unknown action: ${action}` }); return; }
  const truncated = text.slice(0, 8000);
  const t0 = Date.now();
  const result = await generateAiText(cfg.user(truncated, context), cfg.system, cfg.maxTokens || 800, KIMI_FAST_MODEL, 0.3);
  if (!result) { res.status(502).json({ error: "AI returned empty" }); return; }
  const cleaned = cleanAiOutput(result);
  res.json({ result: cleaned });
  // Log
  const channel = action === "smart_reply" ? "smart-reply" : action === "summarize" ? "summarize" : "text-action";
  logAi({
    channel, action, user: (req as any).user,
    messages: [{ role: "user", content: truncated }, { role: "assistant", content: cleaned }],
    inputPreview: truncated, outputPreview: cleaned,
    durationMs: Date.now() - t0, model: KIMI_FAST_MODEL,
  });
});

// =====================================================================
// Classify a contact-form message: category + priority
// =====================================================================
router.post("/ai/classify-message", requireAuth, async (req, res): Promise<void> => {
  if (!KIMI_API_KEY) { res.status(503).json({ error: "AI service unavailable" }); return; }
  const { subject, body } = req.body as { subject?: string; body?: string };
  if (!body) { res.status(400).json({ error: "body required" }); return; }
  const sys = `You are a strict JSON classifier for Nawa Real Estate customer messages. Output ONLY a single JSON object, no other text, no markdown, no code fences. Schema:
{"category":"inquiry|complaint|investment|partnership|career|media|support|other","priority":"low|medium|high|urgent","summary":"one short sentence in same language as input","language":"ar|en"}
Rules: complaints with words like شكوى/غاضب/مرفوض/angry/refund => priority urgent. Investment requests => investment + high. Partnership offers => partnership + medium.`;
  const t0 = Date.now();
  const out = await generateAiText(`Subject: ${subject || ""}\n\nBody: ${body.slice(0, 4000)}\n\nOutput JSON now:`, sys, 300, KIMI_FAST_MODEL, 0.1);
  let result: any;
  try {
    const m = out.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("no json");
    result = JSON.parse(m[0]);
  } catch {
    result = { category: "other", priority: "medium", summary: "", language: "ar" };
  }
  res.json(result);
  logAi({
    channel: "classify", user: (req as any).user,
    messages: [
      { role: "user", content: `Subject: ${subject || ""}\n\n${body.slice(0, 2000)}` },
      { role: "assistant", content: JSON.stringify(result) },
    ],
    inputPreview: subject || body.slice(0, 100),
    outputPreview: `${result.category} / ${result.priority}`,
    durationMs: Date.now() - t0, model: KIMI_FAST_MODEL,
  });
});

// =====================================================================
// Public chatbot — no auth, scoped to public Nawa info
// =====================================================================
const publicChatRateLimit = new Map<string, { count: number; resetAt: number }>();
function checkPublicRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = publicChatRateLimit.get(ip);
  if (!entry || entry.resetAt < now) {
    publicChatRateLimit.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}

router.post("/ai/public-chat", async (req, res): Promise<void> => {
  if (!KIMI_API_KEY) { res.status(503).json({ error: "AI service unavailable" }); return; }
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown";
  if (!checkPublicRateLimit(ip)) { res.status(429).json({ error: "Too many requests" }); return; }
  const { message, history } = req.body as { message?: string; history?: Array<{ role: string; content: string }> };
  if (!message || typeof message !== "string") { res.status(400).json({ error: "message required" }); return; }
  const t0 = Date.now();

  // Pull live public data so chatbot answers from real database, not hallucinations
  // Only allow explicitly public statuses — never $ne filters which leak future statuses
  const PUBLIC_PROJECT_STATUSES = ["active", "completed", "in_progress", "planning", "available"];
  const [projects, services, news] = await Promise.all([
    Project.find({ status: { $in: PUBLIC_PROJECT_STATUSES } }).select("titleAr title locationAr location type status priceFromSar").limit(15).lean(),
    (await import("@workspace/db")).Service.find().select("titleAr title descriptionAr description").limit(10).lean(),
    News.find({ status: "published" }).select("titleAr title category publishedAt").sort({ publishedAt: -1 }).limit(5).lean(),
  ]);

  const trim = (s: any, n: number) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);
  const dataContext = `
=== Nawa Real Estate live data ===
Projects (${projects.length}):
${projects.map((p: any) => `- ${trim(p.titleAr || p.title, 80)} | ${trim(p.locationAr || p.location, 40)} | type: ${trim(p.type, 20)} | status: ${trim(p.status, 20)}${p.priceFromSar ? ` | from ${p.priceFromSar} SAR` : ""}`).join("\n")}

Services (${services.length}):
${services.map((s: any) => `- ${trim(s.titleAr || s.title, 60)}: ${trim(s.descriptionAr || s.description, 100)}`).join("\n")}

Latest news:
${news.map((n: any) => `- [${trim(n.category, 20)}] ${trim(n.titleAr || n.title, 80)}`).join("\n")}

Contact: info@nawainv.sa | +966500073509 | Riyadh, Saudi Arabia
Website: nawainv.sa
`;

  // Inject curated learnings (RAG) so AI gets smarter over time
  const learnings = await getRelevantLearnings("public-chat", message, 5);
  const learningsBlock = learnings.length > 0
    ? `\n=== Curated past Q&A (use these as gold-standard examples for similar questions) ===\n${learnings.map((l, i) => `Q${i + 1}: ${l.q}\nA${i + 1}: ${l.a}`).join("\n\n")}\n`
    : "";

  const system = `You are "نوى" (Nawa) — the friendly Arabic-first AI assistant for Nawa Real Estate (نوى العقارية). 
Answer in the SAME language as the user (Arabic by default). 
Be warm, concise (max 4 short sentences unless asked for detail), and helpful. 
Use ONLY facts from the live data below and the curated Q&A. If you don't know, say so politely and suggest contacting the team. 
Never invent prices, projects, or contact info. 
For specific queries (viewing, pricing, partnerships) suggest contacting info@nawainv.sa or +966500073509.

${dataContext}${learningsBlock}`;

  const messages: any[] = [{ role: "system", content: system }];
  if (Array.isArray(history)) {
    for (const h of history.slice(-8)) {
      if ((h.role === "user" || h.role === "assistant") && typeof h.content === "string") {
        messages.push({ role: h.role, content: h.content.slice(0, 1000) });
      }
    }
  }
  messages.push({ role: "user", content: message.slice(0, 1000) });

  try {
    const r = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KIMI_API_KEY}` },
      body: JSON.stringify({ model: KIMI_FAST_MODEL, messages, max_tokens: 600, temperature: 0.6 }),
    });
    if (!r.ok) {
      const errBody = await r.text().catch(() => "");
      logger.error({ status: r.status, body: errBody.slice(0, 500) }, "public-chat upstream failed");
      res.status(502).json({ error: "AI upstream failed" }); return;
    }
    const data = await r.json() as any;
    const raw = data.choices?.[0]?.message?.content || data.choices?.[0]?.message?.reasoning_content || "";
    const reply = cleanAiOutput(raw);
    res.json({ reply });
    // Log full conversation
    const fullMessages = [...(history || []).slice(-8).map(h => ({ role: h.role, content: String(h.content) })), { role: "user", content: message }, { role: "assistant", content: reply }];
    logAi({
      channel: "public-chat",
      visitorIp: ip,
      visitorUserAgent: req.headers["user-agent"] as string,
      messages: fullMessages,
      inputPreview: message,
      outputPreview: reply,
      durationMs: Date.now() - t0, model: KIMI_FAST_MODEL,
    });
  } catch (err) {
    logger.error({ err }, "public-chat failed");
    res.status(502).json({ error: "AI request failed" });
  }
});

// =====================================================================
// Admin endpoints: browse conversations, rate, save as learning, manage
// =====================================================================
function requireAdmin(req: any, res: any, next: any): void {
  if (!isAdmin(req.user)) { res.status(403).json({ error: "Admin only" }); return; }
  next();
}

router.get("/ai/conversations", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || "25"), 10)));
  const channel = req.query.channel ? String(req.query.channel) : null;
  const search = req.query.search ? String(req.query.search).trim() : null;
  const filter: any = {};
  if (channel) filter.channel = channel;
  if (search) {
    const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ inputPreview: re }, { outputPreview: re }, { userName: re }];
  }
  const [items, total, byChannelAgg] = await Promise.all([
    AiConversation.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
      .select("channel action userId userName userRole visitorIp inputPreview outputPreview rating durationMs model createdAt").lean(),
    AiConversation.countDocuments(filter),
    AiConversation.aggregate([{ $group: { _id: "$channel", count: { $sum: 1 } } }]),
  ]);
  const byChannel: Record<string, number> = {};
  let totalAll = 0;
  for (const r of byChannelAgg) { byChannel[r._id] = r.count; totalAll += r.count; }
  res.json({ items: items.map((i: any) => ({ ...i, id: String(i._id) })), total, stats: { total: totalAll, byChannel } });
});

router.get("/ai/conversations/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const conv = await AiConversation.findById(req.params.id).lean();
  if (!conv) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...conv, id: String((conv as any)._id) });
});

router.post("/ai/conversations/:id/rate", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const { rating, note } = req.body as { rating?: "good" | "bad" | null; note?: string };
  await AiConversation.findByIdAndUpdate(req.params.id, {
    $set: { rating: rating || null, reviewedBy: (req as any).user?.name || null, reviewNote: note || null },
  });
  res.json({ ok: true });
});

router.delete("/ai/conversations/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  await AiConversation.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

router.get("/ai/learnings", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const items = await AiLearning.find().sort({ createdAt: -1 }).limit(200).lean();
  res.json({ items: items.map((i: any) => ({ ...i, id: String(i._id) })) });
});

router.post("/ai/learnings", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const { question, answer, channel, tags, sourceConversationId } = req.body as any;
  if (!question || !answer) { res.status(400).json({ error: "question + answer required" }); return; }
  const created = await AiLearning.create({
    question: String(question).slice(0, 2000),
    answer: String(answer).slice(0, 4000),
    channel: channel || "public-chat",
    tags: Array.isArray(tags) ? tags : [],
    sourceConversationId: sourceConversationId || null,
    approvedBy: (req as any).user?.name || (req as any).user?.email || "admin",
    enabled: true,
  });
  res.json({ ok: true, id: String(created._id) });
});

router.patch("/ai/learnings/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const { enabled, question, answer, tags } = req.body as any;
  const update: any = {};
  if (typeof enabled === "boolean") update.enabled = enabled;
  if (typeof question === "string") update.question = question.slice(0, 2000);
  if (typeof answer === "string") update.answer = answer.slice(0, 4000);
  if (Array.isArray(tags)) update.tags = tags;
  await AiLearning.findByIdAndUpdate(req.params.id, { $set: update });
  res.json({ ok: true });
});

router.delete("/ai/learnings/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  await AiLearning.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// Helper for other routes to ask Kimi for content (used by message auto-reply etc.)
export async function generateAiText(prompt: string, system?: string, maxTokens = 512, modelOverride?: string, temperature?: number): Promise<string> {
  if (!KIMI_API_KEY) return "";
  try {
    const r = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KIMI_API_KEY}` },
      body: JSON.stringify({
        model: modelOverride || KIMI_MODEL,
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          { role: "user", content: prompt },
        ],
        max_tokens: maxTokens,
        temperature: temperature ?? 1,
      }),
    });
    if (!r.ok) return "";
    const data = await r.json() as any;
    const m = data.choices?.[0]?.message;
    return m?.content || m?.reasoning_content || "";
  } catch {
    return "";
  }
}

export default router;
