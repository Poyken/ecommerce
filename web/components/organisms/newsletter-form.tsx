"use client";

import { GlassButton } from "@/components/atoms/glass-button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

/**
 * =====================================================================
 * NEWSLETTER FORM - Form đăng ký nhận tin
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. FORM HANDLING:
 * - Sử dụng `useState` để quản lý `email` và `status` (idle, loading, success, error).
 * - `noValidate`: Tắt validation mặc định của trình duyệt để dùng custom validation bằng JS.
 *
 * 2. API INTEGRATION:
 * - Sử dụng `httpClient` để gửi request POST lên server.
 * - Hiển thị `Loader2` (spinner) khi đang gửi request để báo hiệu cho người dùng.
 *
 * 3. SUCCESS STATE:
 * - Khi đăng ký thành công, ẩn form và hiển thị thông báo cảm ơn với hiệu ứng `animate-in`.
 * =====================================================================
 */

export function NewsletterForm() {
  const t = useTranslations("newsletter");
  const tToast = useTranslations("common.toast");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Custom Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      toast({
        variant: "destructive",
        title: t("invalidInput"),
        description: t("invalidEmail"),
      });
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch("/api/v1/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to subscribe");
      }

      setStatus("success");
      setEmail("");
      toast({
        variant: "success",
        title: tToast("success"),
        description: t("successDesc"),
      });
    } catch (error: any) {
      setStatus("error");
      toast({
        variant: "destructive",
        title: tToast("error"),
        description: error.message || t("errorDesc"),
      });
    }
  };

  return (
    <div className="relative z-10 max-w-2xl mx-auto space-y-8">
      <div className="space-y-4 text-center">
        <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic text-foreground">
          {t("title")}
        </h2>
        <p className="text-muted-foreground/80 text-lg font-medium max-w-lg mx-auto">
          {t("subtitle")}
        </p>
      </div>

      {status === "success" ? (
        <div className="bg-primary/5 border border-primary/10 text-primary p-8 rounded-[2rem] flex flex-col items-center justify-center gap-4 text-lg font-black animate-in fade-in zoom-in duration-500">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
            <CheckCircle2 size={32} />
          </div>
          <span className="uppercase tracking-widest">{t("thankYou")}</span>
          <span className="text-sm font-bold opacity-60 uppercase tracking-tighter">
            {t("checkInbox")}
          </span>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto items-center"
          noValidate
        >
          <div className="w-full flex-1">
            <input
              type="email"
              placeholder={t("placeholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "loading"}
              className="w-full bg-foreground/[0.03] dark:bg-white/[0.03] border border-foreground/5 dark:border-white/5 text-foreground placeholder:text-muted-foreground/40 rounded-full px-8 py-5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all disabled:opacity-50 text-sm font-bold"
            />
          </div>
          <GlassButton
            type="submit"
            size="lg"
            className="w-full sm:w-auto font-black uppercase tracking-widest rounded-full px-12 py-5 bg-primary text-primary-foreground hover:opacity-90 transition-all duration-300 shadow-2xl shadow-primary/20"
            disabled={status === "loading"}
          >
            {status === "loading" ? (
              <Loader2 className="animate-spin" />
            ) : (
              t("subscribe")
            )}
          </GlassButton>
        </form>
      )}
    </div>
  );
}
