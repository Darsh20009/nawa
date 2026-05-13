import { useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useGetSiteSettings, useUpdateSiteSettings } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Save, Globe, Phone, Share2, Search, Building2, Info } from "lucide-react";

const SocialIcon = ({ name }: { name: string }) => {
  const icons: Record<string, string> = {
    facebook: "f",
    twitter: "𝕏",
    instagram: "📷",
    linkedin: "in",
    youtube: "▶",
    tiktok: "♪",
    snapchat: "👻",
  };
  return <span className="text-xs font-bold w-5 text-center">{icons[name] || name[0]}</span>;
};

export default function AdminSettings() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    document.title = language === "ar" ? "إعدادات النظام | نوى العقارية" : "System Settings | Nawa Real Estate Platform";
  }, [language]);

  const { data: settings, isLoading } = useGetSiteSettings();

  const form = useForm({
    defaultValues: {
      siteName: "",
      siteNameEn: "",
      tagline: "",
      taglineEn: "",
      description: "",
      descriptionEn: "",
      phone: "",
      whatsapp: "",
      email: "",
      address: "",
      addressEn: "",
      googleMapsUrl: "",
      facebook: "",
      twitter: "",
      instagram: "",
      linkedin: "",
      youtube: "",
      tiktok: "",
      snapchat: "",
      crNumber: "",
      vatNumber: "",
      metaTitle: "",
      metaDescription: "",
      metaDescriptionEn: "",
      footerText: "",
      footerTextEn: "",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        siteName: settings.siteName ?? "",
        siteNameEn: settings.siteNameEn ?? "",
        tagline: settings.tagline ?? "",
        taglineEn: settings.taglineEn ?? "",
        description: settings.description ?? "",
        descriptionEn: settings.descriptionEn ?? "",
        phone: settings.phone ?? "",
        whatsapp: settings.whatsapp ?? "",
        email: settings.email ?? "",
        address: settings.address ?? "",
        addressEn: settings.addressEn ?? "",
        googleMapsUrl: settings.googleMapsUrl ?? "",
        facebook: settings.facebook ?? "",
        twitter: settings.twitter ?? "",
        instagram: settings.instagram ?? "",
        linkedin: settings.linkedin ?? "",
        youtube: settings.youtube ?? "",
        tiktok: settings.tiktok ?? "",
        snapchat: settings.snapchat ?? "",
        crNumber: settings.crNumber ?? "",
        vatNumber: settings.vatNumber ?? "",
        metaTitle: settings.metaTitle ?? "",
        metaDescription: settings.metaDescription ?? "",
        metaDescriptionEn: settings.metaDescriptionEn ?? "",
        footerText: settings.footerText ?? "",
        footerTextEn: settings.footerTextEn ?? "",
      });
    }
  }, [settings, form]);

  const updateMut = useUpdateSiteSettings({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
        toast({
          title: language === "ar" ? "تم الحفظ" : "Settings Saved",
          description: language === "ar" ? "تم تحديث إعدادات النظام بنجاح" : "System settings have been updated successfully.",
        });
      },
      onError: () => {
        toast({
          title: language === "ar" ? "خطأ" : "Error",
          description: language === "ar" ? "فشل في حفظ الإعدادات" : "Failed to save settings.",
          variant: "destructive",
        });
      },
    },
  });

  const onSubmit = (data: any) => {
    updateMut.mutate({ data });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading settings..."}</div>
      </div>
    );
  }

  const sectionCard = (children: React.ReactNode) => (
    <div className="bg-white rounded-xl border border-border p-6 space-y-4">{children}</div>
  );

  const sectionTitle = (icon: React.ReactNode, title: string) => (
    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        {icon}
      </div>
      <h2 className="font-semibold text-foreground">{title}</h2>
    </div>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-border shadow-sm">
          <div>
            <h1 className="text-2xl font-bold font-serif text-foreground">
              {language === "ar" ? "إعدادات النظام" : "System Settings"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {language === "ar" ? "تحكم كامل في إعدادات الموقع والتواصل الاجتماعي" : "Full control over site settings and social media"}
            </p>
          </div>
          <Button type="submit" disabled={updateMut.isPending} className="gap-2 shrink-0">
            <Save className="w-4 h-4" />
            {updateMut.isPending
              ? (language === "ar" ? "جاري الحفظ..." : "Saving...")
              : (language === "ar" ? "حفظ الإعدادات" : "Save Settings")}
          </Button>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full h-auto bg-white border border-border rounded-xl p-1 gap-1">
            <TabsTrigger value="general" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              <Info className="w-3.5 h-3.5" />
              {language === "ar" ? "عام" : "General"}
            </TabsTrigger>
            <TabsTrigger value="contact" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              <Phone className="w-3.5 h-3.5" />
              {language === "ar" ? "التواصل" : "Contact"}
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              <Share2 className="w-3.5 h-3.5" />
              {language === "ar" ? "السوشيل ميديا" : "Social Media"}
            </TabsTrigger>
            <TabsTrigger value="seo" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              <Search className="w-3.5 h-3.5" />
              {language === "ar" ? "السيو" : "SEO"}
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="mt-4 space-y-4">
            {sectionCard(
              <>
                {sectionTitle(<Globe className="w-4 h-4" />, language === "ar" ? "معلومات الموقع" : "Site Information")}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="siteName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "ar" ? "اسم الموقع (عربي)" : "Site Name (Arabic)"}</FormLabel>
                      <FormControl><Input {...field} dir="rtl" placeholder="نوى العقارية" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="siteNameEn" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "ar" ? "اسم الموقع (إنجليزي)" : "Site Name (English)"}</FormLabel>
                      <FormControl><Input {...field} placeholder="Nawa Real Estate Platform" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="tagline" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "ar" ? "الشعار (عربي)" : "Tagline (Arabic)"}</FormLabel>
                      <FormControl><Input {...field} dir="rtl" placeholder="شريكك في الاستثمار العقاري" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="taglineEn" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "ar" ? "الشعار (إنجليزي)" : "Tagline (English)"}</FormLabel>
                      <FormControl><Input {...field} placeholder="Your Real Estate Investment Partner" /></FormControl>
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "ar" ? "وصف الموقع (عربي)" : "Site Description (Arabic)"}</FormLabel>
                    <FormControl><Textarea rows={3} {...field} dir="rtl" /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="descriptionEn" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "ar" ? "وصف الموقع (إنجليزي)" : "Site Description (English)"}</FormLabel>
                    <FormControl><Textarea rows={3} {...field} /></FormControl>
                  </FormItem>
                )} />
              </>
            )}

            {sectionCard(
              <>
                {sectionTitle(<Building2 className="w-4 h-4" />, language === "ar" ? "معلومات الشركة" : "Company Information")}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="crNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "ar" ? "رقم السجل التجاري" : "CR Number"}</FormLabel>
                      <FormControl><Input {...field} placeholder="1010000000" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="vatNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "ar" ? "الرقم الضريبي (VAT)" : "VAT Number"}</FormLabel>
                      <FormControl><Input {...field} placeholder="300000000000003" /></FormControl>
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="footerText" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "ar" ? "نص الفوتر (عربي)" : "Footer Text (Arabic)"}</FormLabel>
                      <FormControl><Input {...field} dir="rtl" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="footerTextEn" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "ar" ? "نص الفوتر (إنجليزي)" : "Footer Text (English)"}</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                    </FormItem>
                  )} />
                </div>
              </>
            )}
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="mt-4 space-y-4">
            {sectionCard(
              <>
                {sectionTitle(<Phone className="w-4 h-4" />, language === "ar" ? "معلومات التواصل" : "Contact Information")}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "ar" ? "رقم الهاتف" : "Phone Number"}</FormLabel>
                      <FormControl><Input {...field} placeholder="+966500073509" dir="ltr" /></FormControl>
                      <FormDescription className="text-xs">{language === "ar" ? "يظهر في الموقع وبيانات التواصل" : "Displayed on site and contact info"}</FormDescription>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="whatsapp" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "ar" ? "رقم واتساب" : "WhatsApp Number"}</FormLabel>
                      <FormControl><Input {...field} placeholder="+966500073509" dir="ltr" /></FormControl>
                      <FormDescription className="text-xs">{language === "ar" ? "للتواصل عبر واتساب" : "For WhatsApp contact"}</FormDescription>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "ar" ? "البريد الإلكتروني" : "Email Address"}</FormLabel>
                      <FormControl><Input {...field} type="email" placeholder="info@nawainv.sa" /></FormControl>
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "ar" ? "العنوان (عربي)" : "Address (Arabic)"}</FormLabel>
                      <FormControl><Textarea rows={2} {...field} dir="rtl" placeholder="الرياض، المملكة العربية السعودية" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="addressEn" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "ar" ? "العنوان (إنجليزي)" : "Address (English)"}</FormLabel>
                      <FormControl><Textarea rows={2} {...field} placeholder="Riyadh, Saudi Arabia" /></FormControl>
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="googleMapsUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "ar" ? "رابط خرائط جوجل" : "Google Maps URL"}</FormLabel>
                    <FormControl><Input {...field} placeholder="https://maps.google.com/..." /></FormControl>
                    <FormDescription className="text-xs">{language === "ar" ? "رابط الموقع على خرائط جوجل لعرضه في صفحة التواصل" : "Link to location on Google Maps for the contact page"}</FormDescription>
                  </FormItem>
                )} />
              </>
            )}
          </TabsContent>

          {/* Social Media Tab */}
          <TabsContent value="social" className="mt-4">
            {sectionCard(
              <>
                {sectionTitle(<Share2 className="w-4 h-4" />, language === "ar" ? "روابط التواصل الاجتماعي" : "Social Media Links")}
                <p className="text-sm text-muted-foreground -mt-2 mb-4">
                  {language === "ar" ? "أضف الروابط الكاملة لحسابات التواصل الاجتماعي. اتركها فارغة لإخفائها من الموقع." : "Add full URLs to social media accounts. Leave empty to hide from site."}
                </p>
                <div className="space-y-3">
                  {[
                    { name: "facebook", label: "Facebook", placeholder: "https://facebook.com/nawainv", color: "text-blue-600" },
                    { name: "twitter", label: "X (Twitter)", placeholder: "https://twitter.com/nawainv", color: "text-gray-900" },
                    { name: "instagram", label: "Instagram", placeholder: "https://instagram.com/nawainv", color: "text-pink-600" },
                    { name: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/nawainv", color: "text-blue-700" },
                    { name: "youtube", label: "YouTube", placeholder: "https://youtube.com/@nawainv", color: "text-red-600" },
                    { name: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@nawainv", color: "text-gray-900" },
                    { name: "snapchat", label: "Snapchat", placeholder: "https://snapchat.com/add/nawainv", color: "text-yellow-500" },
                  ].map(({ name, label, placeholder, color }) => (
                    <FormField
                      key={name}
                      control={form.control}
                      name={name as any}
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl border border-border flex items-center justify-center shrink-0 bg-muted/30 ${color} font-bold text-sm`}>
                              <SocialIcon name={name} />
                            </div>
                            <div className="flex-1">
                              <FormLabel className="text-sm font-medium">{label}</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  placeholder={placeholder}
                                  className="mt-1"
                                  dir="ltr"
                                />
                              </FormControl>
                            </div>
                          </div>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* SEO Tab */}
          <TabsContent value="seo" className="mt-4">
            {sectionCard(
              <>
                {sectionTitle(<Search className="w-4 h-4" />, language === "ar" ? "إعدادات محركات البحث (SEO)" : "Search Engine Optimization (SEO)")}
                <p className="text-sm text-muted-foreground -mt-2 mb-4">
                  {language === "ar" ? "هذه الإعدادات تؤثر على ظهور الموقع في محركات البحث." : "These settings affect how the site appears in search engines."}
                </p>
                <div className="space-y-4">
                  <FormField control={form.control} name="metaTitle" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Title</FormLabel>
                      <FormControl><Input {...field} placeholder="نوى العقارية | استثمر بذكاء" /></FormControl>
                      <FormDescription className="text-xs">{language === "ar" ? "العنوان الذي يظهر في نتائج البحث وتبويبات المتصفح" : "Title shown in search results and browser tabs"}</FormDescription>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="metaDescription" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "ar" ? "وصف Meta (عربي)" : "Meta Description (Arabic)"}</FormLabel>
                      <FormControl><Textarea rows={3} {...field} dir="rtl" placeholder="نوى العقارية - شريكك في الاستثمار العقاري بالمملكة العربية السعودية..." /></FormControl>
                      <FormDescription className="text-xs">{language === "ar" ? "يُنصح بـ 150-160 حرف" : "Recommended: 150-160 characters"}</FormDescription>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="metaDescriptionEn" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "ar" ? "وصف Meta (إنجليزي)" : "Meta Description (English)"}</FormLabel>
                      <FormControl><Textarea rows={3} {...field} placeholder="Nawa Real Estate Platform — Your partner in real estate investment in Saudi Arabia..." /></FormControl>
                      <FormDescription className="text-xs">{language === "ar" ? "يُنصح بـ 150-160 حرف" : "Recommended: 150-160 characters"}</FormDescription>
                    </FormItem>
                  )} />
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Bottom Save Button */}
        <div className="flex justify-end pb-4">
          <Button type="submit" disabled={updateMut.isPending} size="lg" className="gap-2 px-8">
            <Save className="w-4 h-4" />
            {updateMut.isPending
              ? (language === "ar" ? "جاري الحفظ..." : "Saving...")
              : (language === "ar" ? "حفظ الإعدادات" : "Save Settings")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
