"use client";

import { resetPasswordAction } from "@/features/auth/actions";
import { GlassButton } from "@/components/shared/glass-button";
import { GlassCard } from "@/components/shared/glass-card";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/shared/password-input";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "@/i18n/routing";
import { resetPasswordSchema } from "@/lib/schemas";
import { m } from "@/lib/animations";
import { AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";

/**
 * =====================================================================
 * RESET PASSWORD CONTENT - Xử lý UI Đặt lại mật khẩu
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. TOKEN VALIDATION:
 * - Token được lấy từ URL query string (`?token=...`).
 * - Nếu không có token, hiển thị màn hình lỗi "Invalid Link".
 *
 * 2. PASSWORD CONFIRMATION:
 * - Form yêu cầu nhập mật khẩu mới 2 lần.
 * - `resetPasswordAction` sẽ kiểm tra xem 2 mật khẩu này có khớp nhau không trước khi cập nhật vào DB.
 *
 * 3. SECURITY:
 * - Token này thường chỉ có hiệu lực trong thời gian ngắn (vd: 1 giờ) và chỉ dùng được 1 lần. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

export function ResetPasswordPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { toast } = useToast();

  const t = useTranslations("auth.resetPassword");
  const tToast = useTranslations("common.toast");
  const [state, action, isPending] = useActionState(resetPasswordAction, null);

  const [localErrors, setLocalErrors] = useState<Record<string, string[]>>({});
  const submissionCount = useRef(0);
  const lastProcessedCount = useRef(0);

  const handleAction = (formData: FormData) => {
    submissionCount.current++;
    action(formData);
  };

  useEffect(() => {
    if (state && submissionCount.current > lastProcessedCount.current) {
      lastProcessedCount.current = submissionCount.current;

      if (state.errors) {
        requestAnimationFrame(() => setLocalErrors(state.errors || {}));
      } else {
        requestAnimationFrame(() => setLocalErrors({})); // Clear errors if state has no errors
      }

      if (state.error) {
        toast({
          variant: "destructive",
          title: tToast("error"),
          description: state.error,
        });
      }
    }
  }, [state, toast, tToast]);

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background selection:bg-accent/30">
        <GlassCard
          className="p-10 max-w-md w-full text-center rounded-4xl border-foreground/5 shadow-xl"
          variant="heavy"
        >
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-3xl font-serif font-normal mb-3">
            {t("invalidLinkTitle")}
          </h1>
          <p className="text-muted-foreground mb-8 font-light">
            {t("invalidLinkDescription")}
          </p>
          <Link href="/forgot-password">
            <GlassButton className="font-bold uppercase tracking-wide">
              {t("requestNewLink")}
            </GlassButton>
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <m.div
      initial="hidden"
      animate="visible"
      variants={sectionVariants}
      className="w-full"
    >
      <GlassCard
        className="p-8 border-none shadow-none bg-transparent"
        variant="default"
      >
        <div className="mb-8 text-center space-y-3">
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-accent block">
            New Password
          </span>
          <h1 className="text-4xl font-serif font-normal tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="text-muted-foreground font-light">{t("subtitle")}</p>
        </div>

        {state?.success ? (
          <div className="bg-primary/10 border border-primary/30 text-primary p-8 rounded-4xl flex flex-col items-center justify-center gap-4 text-lg font-medium animate-in fade-in zoom-in duration-500 shadow-lg shadow-primary/5">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <CheckCircle2 size={48} className="animate-bounce" />
            </div>
            <div className="text-center">
              <p className="font-black text-2xl">{t("successTitle")}</p>
              <p className="text-sm text-primary/70 mt-2 font-medium">
                {state.message}
              </p>
            </div>
            <Link href="/login" className="mt-4">
              <GlassButton
                variant="secondary"
                size="sm"
                className="font-bold uppercase tracking-wide"
              >
                {t("signInNow")}
              </GlassButton>
            </Link>
          </div>
        ) : (
          <m.form
            layout
            action={handleAction}
            className="space-y-6"
            noValidate
          >
            <input type="hidden" name="token" value={token} />

            <div className="space-y-2">
              <Label
                htmlFor="newPassword"
                className="text-foreground/80 font-bold"
              >
                {t("newPasswordLabel")}
              </Label>
              <PasswordInput
                id="newPassword"
                name="newPassword"
                placeholder="••••••••"
                className={`bg-foreground/3 border-foreground/10 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/50 h-12 rounded-2xl ${
                  localErrors.newPassword ? "border-red-500" : ""
                }`}
                onChange={(e) => {
                  const value = e.target.value;
                  if (localErrors.newPassword) {
                    const result =
                      resetPasswordSchema.shape.newPassword.safeParse(value);
                    if (result.success) {
                      const newErrors = { ...localErrors };
                      delete newErrors.newPassword;
                      setLocalErrors(newErrors);
                    } else {
                      setLocalErrors({
                        ...localErrors,
                        newPassword: result.error.flatten().formErrors,
                      });
                    }
                  }
                }}
              />
              <AnimatePresence initial={false}>
                {localErrors.newPassword && (
                  <m.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="text-red-500 text-sm mt-1">
                      {localErrors.newPassword[0]}
                    </p>
                  </m.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-foreground/80 font-bold"
              >
                {t("confirmPasswordLabel")}
              </Label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                placeholder="••••••••"
                className={`bg-foreground/3 border-foreground/10 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/50 h-12 rounded-2xl ${
                  localErrors.confirmPassword ? "border-red-500" : ""
                }`}
                onChange={(e) => {
                  const value = e.target.value;
                  if (localErrors.confirmPassword) {
                    const result =
                      resetPasswordSchema.shape.confirmPassword.safeParse(
                        value
                      );
                    if (result.success) {
                      const newErrors = { ...localErrors };
                      delete newErrors.confirmPassword;
                      setLocalErrors(newErrors);
                    } else {
                      setLocalErrors({
                        ...localErrors,
                        confirmPassword: result.error.flatten().formErrors,
                      });
                    }
                  }
                }}
              />
              <AnimatePresence initial={false}>
                {localErrors.confirmPassword && (
                  <m.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="text-red-500 text-sm mt-1">
                      {localErrors.confirmPassword[0]}
                    </p>
                  </m.div>
                )}
              </AnimatePresence>
            </div>

            <GlassButton
              type="submit"
              className="w-full h-12 text-base font-black bg-primary hover:opacity-90 text-primary-foreground shadow-xl shadow-primary/20"
              loading={isPending}
            >
              {t("submit")}
            </GlassButton>
          </m.form>
        )}
      </GlassCard>
    </m.div>
  );
}
