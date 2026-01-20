"use client";

import { GlassButton } from "@/components/shared/glass-button";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { subscribeNewsletter } from "../actions";

/**
 * =====================================================================
 * NEWSLETTER FORM - Form đăng ký nhận tin
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. FORM HANDLING (NEXT-SAFE-ACTION):
 * - Sử dụng `useAction` hook để quản lý trạng thái action (isExecuting, result).
 * - Tự động hóa quá trình validation ở client thông qua schema.
 *
 * 2. API INTEGRATION:
 * - Thay thế `fetch` thủ công bằng Server Action `subscribeNewsletter`.
 * - Đảm bảo tính nhất quán về xử lý lỗi và hiển thị thông báo.
 *
 * 3. SUCCESS STATE:
 * - Khi đăng ký thành công, `result.data?.success` sẽ là true, UI tự động cập nhật.
 *
 * =====================================================================
 */

export function NewsletterForm() {
  const t = useTranslations("newsletter");
  const tToast = useTranslations("common.toast");
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const { execute, isExecuting, result } = useAction(subscribeNewsletter, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        toast({
          variant: "success",
          title: tToast("success"),
          description: t(data.message || "success"),
        });
        setEmail("");
      }
    },
    onError: ({ error }) => {
      toast({
        variant: "destructive",
        title: tToast("error"),
        description: error.serverError || t("errorDesc"),
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    execute({ email });
  };

  const isSuccess = result.data?.success;

  return (
    <div className="relative z-10 max-w-2xl mx-auto space-y-10 py-12">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 blur-[80px] rounded-full pointer-events-none -z-10" />

      <div className="space-y-6 text-center">
        <h2 className="text-4xl md:text-6xl font-editorial-bold tracking-tighter uppercase italic text-foreground leading-[0.9]">
          {t("title")}
        </h2>
        <p className="text-muted-foreground/80 text-lg font-medium max-w-lg mx-auto leading-relaxed">
          {t("subtitle")}
        </p>
      </div>

      {isSuccess ? (
        <div className="bg-primary/5 border border-primary/20 text-primary p-12 rounded-[2.5rem] flex flex-col items-center justify-center gap-6 animate-in fade-in zoom-in duration-500 backdrop-blur-xl shadow-2xl shadow-primary/10">
          <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-2 shadow-inner border border-primary/20">
            <CheckCircle2 size={40} className="text-primary animate-pulse" />
          </div>
          <span className="text-xl font-black uppercase tracking-[0.2em]">
            {t("thankYou")}
          </span>
          <span className="text-sm font-bold opacity-60 uppercase tracking-widest">
            {t("checkInbox")}
          </span>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto items-center relative"
          noValidate
        >
          <div className="w-full flex-1 relative group">
            <input
              type="email"
              placeholder={t("placeholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isExecuting}
              className="w-full h-16 bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground/40 rounded-2xl px-8 focus:outline-none focus:bg-white/10 focus:border-primary/50 transition-all disabled:opacity-50 text-base font-bold shadow-lg focus:shadow-primary/20 hover:border-white/20"
            />
          </div>
          <GlassButton
            type="submit"
            size="lg"
            className="w-full sm:w-auto h-16 font-black uppercase tracking-[0.2em] rounded-2xl px-10 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl shadow-primary/20 border-white/10"
            disabled={isExecuting}
          >
            {isExecuting ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              t("subscribe")
            )}
          </GlassButton>
        </form>
      )}
    </div>
  );
}

