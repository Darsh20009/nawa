import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const siteSettingsTable = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  siteName: text("site_name").notNull().default("منصة نوى العقارية"),
  siteNameEn: text("site_name_en").notNull().default("Nawa Real Estate Platform"),
  tagline: text("tagline").default("شريكك في الاستثمار العقاري"),
  taglineEn: text("tagline_en").default("Your Real Estate Investment Partner"),
  description: text("description"),
  descriptionEn: text("description_en"),
  phone: text("phone").default("+966500000000"),
  whatsapp: text("whatsapp").default("+966500000000"),
  email: text("email").default("info@nawainv.sa"),
  address: text("address").default("الرياض، المملكة العربية السعودية"),
  addressEn: text("address_en").default("Riyadh, Saudi Arabia"),
  googleMapsUrl: text("google_maps_url"),
  facebook: text("facebook"),
  twitter: text("twitter"),
  instagram: text("instagram"),
  linkedin: text("linkedin"),
  youtube: text("youtube"),
  tiktok: text("tiktok"),
  snapchat: text("snapchat"),
  crNumber: text("cr_number"),
  vatNumber: text("vat_number"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  metaDescriptionEn: text("meta_description_en"),
  footerText: text("footer_text"),
  footerTextEn: text("footer_text_en"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const updateSiteSettingsSchema = createInsertSchema(siteSettingsTable).omit({ id: true, updatedAt: true }).partial();
export type UpdateSiteSettings = z.infer<typeof updateSiteSettingsSchema>;
export type SiteSettings = typeof siteSettingsTable.$inferSelect;
