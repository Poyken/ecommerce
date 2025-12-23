"use client";

import { forgotPasswordAction } from "@/actions/auth";
import { GlassButton } from "@/components/atoms/glass-button";
import { GlassCard } from "@/components/atoms/glass-card";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "@/i18n/routing";
import { forgotPasswordSchema } from "@/lib/schemas";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";

/**
 * =====================================================================
 * FORGOT PASSWORD CONTENT - Xử lý UI Quên mật khẩu
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. FLOW:
 * - User nhập email -> Gửi yêu cầu reset mật khẩu qua `forgotPasswordAction`.
 * - Backend gửi email chứa link reset (có đính kèm token bảo mật).
 *
 * 2. SUCCESS STATE:
 * - Khi `state.success` là true, ta ẩn form và hiển thị thông báo "Check your email".
 * - Giúp giảm bớt sự phức tạp của giao diện và tập trung vào hành động tiếp theo của user.
 * =====================================================================
 */

export function ForgotPasswordPageContent() {
  const t = useTranslations("auth.forgotPassword");
  const tToast = useTranslations("common.toast");
  const [state, action, isPending] = useActionState(forgotPasswordAction, null);
  const { toast } = useToast();

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

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2 overflow-hidden bg-background">
      {/* Left Side - Image */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-muted relative overflow-hidden h-full">
        <Image
          src="/images/auth/auth-bg-original.webp"
          unoptimized
          alt="Authentication Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40" /> {/* Overlay */}
        <div className="relative z-10 text-white p-10 max-w-lg text-center space-y-6">
          <h2 className="text-5xl font-black tracking-tight">
            {t("heroTitle")}
          </h2>
          <p className="text-xl text-white/90 font-medium">
            {t("heroSubtitle")}
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex items-center justify-center p-8 h-full relative">
        {/* Background Gradients for Right Side */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] pointer-events-none opacity-50" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[150px] pointer-events-none opacity-50" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          className="w-full max-w-md relative z-10"
        >
          <GlassCard
            className="p-8 border-none shadow-none bg-transparent"
            variant="default"
          >
            <div className="mb-8 text-center space-y-3">
              <h1 className="text-4xl font-black tracking-tight text-foreground">
                {t("title")}
              </h1>
              <p className="text-muted-foreground/70 font-medium">
                {t("subtitle")}
              </p>
            </div>

            {state?.success ? (
              <div className="bg-primary/10 border border-primary/30 text-primary p-8 rounded-4xl flex flex-col items-center justify-center gap-4 text-lg font-medium animate-in fade-in zoom-in duration-500 shadow-lg shadow-primary/5">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 size={48} className="animate-bounce" />
                </div>
                <div className="text-center">
                  <p className="font-black text-2xl">{t("checkEmailTitle")}</p>
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
                    {t("backToLogin")}
                  </GlassButton>
                </Link>
              </div>
            ) : (
              <motion.form
                layout
                action={handleAction}
                className="space-y-6"
                noValidate
              >
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-foreground/80 font-bold"
                  >
                    {t("emailLabel")}
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    className={`bg-foreground/3 border-foreground/10 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/50 h-12 rounded-2xl ${
                      localErrors.email ? "border-red-500" : ""
                    }`}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (localErrors.email) {
                        const result =
                          forgotPasswordSchema.shape.email.safeParse(value);
                        if (result.success) {
                          const newErrors = { ...localErrors };
                          delete newErrors.email;
                          setLocalErrors(newErrors);
                        } else {
                          setLocalErrors({
                            ...localErrors,
                            email: result.error.flatten().formErrors,
                          });
                        }
                      }
                    }}
                  />
                  <AnimatePresence initial={false}>
                    {localErrors.email && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="text-red-500 text-sm mt-1">
                          {localErrors.email[0]}
                        </p>
                      </motion.div>
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

                <div className="text-center text-sm text-muted-foreground/70 font-medium">
                  {t("rememberPassword")}{" "}
                  <Link
                    href="/login"
                    className="text-primary hover:text-primary/80 transition-colors font-bold"
                  >
                    {t("signIn")}
                  </Link>
                </div>
              </motion.form>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
