import { Schema, model, type InferSchemaType, type Model } from "mongoose";
import { baseOptions } from "../_helpers";

const settingsSchema = new Schema(
  {
    siteName: { type: String, required: true, default: "منصة نوى العقارية" },
    siteNameEn: { type: String, required: true, default: "Nawa Real Estate Platform" },
    tagline: { type: String, default: "شريكك في الاستثمار العقاري" },
    taglineEn: { type: String, default: "Your Real Estate Investment Partner" },
    description: { type: String, default: null },
    descriptionEn: { type: String, default: null },
    phone: { type: String, default: "+966500073509" },
    whatsapp: { type: String, default: "+966500073509" },
    email: { type: String, default: "info@nawainv.sa" },
    address: { type: String, default: "الرياض، المملكة العربية السعودية" },
    addressEn: { type: String, default: "Riyadh, Saudi Arabia" },
    googleMapsUrl: { type: String, default: null },
    facebook: { type: String, default: null },
    twitter: { type: String, default: null },
    instagram: { type: String, default: null },
    linkedin: { type: String, default: null },
    youtube: { type: String, default: null },
    tiktok: { type: String, default: null },
    snapchat: { type: String, default: null },
    crNumber: { type: String, default: null },
    vatNumber: { type: String, default: null },
    metaTitle: { type: String, default: null },
    metaDescription: { type: String, default: null },
    metaDescriptionEn: { type: String, default: null },
    footerText: { type: String, default: null },
    footerTextEn: { type: String, default: null },
  },
  baseOptions,
);

export type SiteSettings = InferSchemaType<typeof settingsSchema> & { id: string; createdAt: Date; updatedAt: Date };
export type UpdateSiteSettings = Partial<Omit<SiteSettings, "id" | "createdAt" | "updatedAt">>;
export const SiteSettings: Model<SiteSettings> = (globalThis as any).__nawa_SiteSettings || model<SiteSettings>("SiteSettings", settingsSchema);
(globalThis as any).__nawa_SiteSettings = SiteSettings;
