import { useRef, useState } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  className?: string;
  aspectRatio?: "square" | "video" | "wide";
  variant?: "card" | "avatar";
  maxSizeMB?: number;
}

const aspectClasses: Record<string, string> = {
  square: "aspect-square",
  video: "aspect-video",
  wide: "aspect-[16/7]",
};

export function ImageUpload({
  value,
  onChange,
  className = "",
  aspectRatio = "video",
  variant = "card",
  maxSizeMB = 10,
}: ImageUploadProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const t = (ar: string, en: string) => (language === "ar" ? ar : en);

  const isAvatar = variant === "avatar";

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: t("نوع غير مدعوم", "Unsupported type"), description: t("يرجى اختيار صورة فقط", "Please select an image file."), variant: "destructive" });
      return;
    }
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      toast({ title: t("الحجم كبير جداً", "File too large"), description: t(`الحد الأقصى ${maxSizeMB} ميجابايت`, `Max size is ${maxSizeMB}MB.`), variant: "destructive" });
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      const metaRes = await fetch("/api/storage/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!metaRes.ok) throw new Error("metadata failed");
      const { uploadURL, objectPath } = await metaRes.json();

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadURL);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`upload ${xhr.status}`)));
        xhr.onerror = () => reject(new Error("network"));
        xhr.send(file);
      });

      // Serve via /api/storage + objectPath
      const servingUrl = `/api/storage${objectPath}`;
      onChange(servingUrl);
      toast({ title: t("تم الرفع بنجاح", "Uploaded"), description: t("تم رفع الصورة", "Image uploaded successfully.") });
    } catch (err) {
      console.error("Upload error:", err);
      toast({ title: t("فشل الرفع", "Upload failed"), description: t("حدث خطأ أثناء رفع الصورة", "An error occurred while uploading."), variant: "destructive" });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const wrapperBase = isAvatar
    ? "relative w-32 h-32 mx-auto rounded-full"
    : `relative w-full ${aspectClasses[aspectRatio]} rounded-xl`;

  if (value) {
    return (
      <div className={`${wrapperBase} overflow-hidden border-2 border-border bg-muted group ${className}`}>
        <img src={value} alt="preview" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
            <Upload className="w-4 h-4 mr-1" />{t("تغيير", "Change")}
          </Button>
          <Button type="button" variant="destructive" size="sm" onClick={() => onChange("")} disabled={uploading}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`${wrapperBase} border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${dragOver ? "border-secondary bg-secondary/5" : "border-border hover:border-secondary/50 hover:bg-muted/50"} ${uploading ? "pointer-events-none" : ""} ${className}`}
    >
      {uploading ? (
        <>
          <Loader2 className="w-8 h-8 animate-spin text-secondary mb-2" />
          <div className="text-xs text-muted-foreground">{t("جاري الرفع", "Uploading")} {progress}%</div>
          <div className="w-3/4 h-1 bg-muted rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-secondary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </>
      ) : (
        <>
          {isAvatar ? <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" /> : <Upload className="w-10 h-10 text-muted-foreground mb-3" />}
          <div className="text-sm font-medium text-foreground">{t("اضغط أو اسحب صورة", "Click or drag image")}</div>
          {!isAvatar && <div className="text-xs text-muted-foreground mt-1">{t(`PNG, JPG, WebP حتى ${maxSizeMB}MB`, `PNG, JPG, WebP up to ${maxSizeMB}MB`)}</div>}
        </>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  );
}
