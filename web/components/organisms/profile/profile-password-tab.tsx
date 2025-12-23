/**
 * =====================================================================
 * PROFILE PASSWORD TAB - Tab đổi mật khẩu
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SECURE INPUT:
 * - Sử dụng `PasswordInput` để ẩn mật khẩu khi nhập, đảm bảo tính riêng tư.
 *
 * 2. VALIDATION:
 * - Yêu cầu nhập cả mật khẩu hiện tại và mật khẩu mới.
 * - Tích hợp với `useTransition` để hiển thị trạng thái "Changing..." khi đang xử lý.
 *
 * 3. FEEDBACK:
 * - Thông báo thành công hoặc lỗi được hiển thị qua hệ thống Toast của ứng dụng.
 * =====================================================================
 */

"use client";

import { updateProfileAction } from "@/actions/profile";
import { GlassButton } from "@/components/atoms/glass-button";
import { GlassCard } from "@/components/atoms/glass-card";
import { Label } from "@/components/atoms/label";
import { PasswordInput } from "@/components/atoms/password-input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

export function ProfilePasswordTab() {
  const { toast } = useToast();
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  const handleUpdateProfile = (formData: FormData) => {
    startTransition(async () => {
      const res = await updateProfileAction(formData);
      if (res.success) {
        toast({
          variant: "success",
          title: tCommon("toast.success"),
          description: t("account.success"),
        });
      } else {
        toast({
          title: tCommon("toast.error"),
          description: res.error,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <GlassCard className="p-6 md:p-8 backdrop-blur-md border-white/10">
        <div className="mb-6 space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">
            {t("password.title")}
          </h2>
          <p className="text-base text-muted-foreground">
            {t("password.subtitle")}
          </p>
        </div>
        <form action={handleUpdateProfile} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current" className="text-base">
                {t("password.current")}
              </Label>
              <PasswordInput
                id="current"
                name="currentPassword"
                required
                disabled={isPending}
                className="w-full bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/10 text-base text-foreground placeholder:text-muted-foreground rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new" className="text-base">
                {t("password.new")}
              </Label>
              <PasswordInput
                id="new"
                name="newPassword"
                required
                disabled={isPending}
                className="w-full bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/10 text-base text-foreground placeholder:text-muted-foreground rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <GlassButton
              type="submit"
              disabled={isPending}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-lg shadow-primary/20 border-none"
            >
              {isPending ? t("password.changing") : t("password.change")}
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </motion.div>
  );
}
