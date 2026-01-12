/**
 * =====================================================================
 * CONTACT FORM - Form liên hệ khách hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. FORM VALIDATION:
 * - Kiểm tra tính hợp lệ của dữ liệu (Name, Email, Subject, Message) trước khi gửi.
 * - Hiển thị thông báo lỗi chi tiết cho từng trường nếu không hợp lệ.
 *
 * 2. USE TRANSITION:
 * - Sử dụng `useTransition` để xử lý quá trình gửi form một cách mượt mà, không làm treo UI.
 * - Hiển thị trạng thái "Sending..." khi đang xử lý.
 *
 * 3. SUCCESS STATE:
 * - Sau khi gửi thành công, hiển thị thông báo cảm ơn và tự động reset form sau vài giây. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

"use client";

import { GlassButton } from "@/components/shared/glass-button";
import { GlassCard } from "@/components/shared/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { m } from "@/lib/animations";
import { CheckCircle2, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

export function ContactForm() {
  const t = useTranslations("contact");
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  // Errors are initialized to {} in useState, so no need to reset them in useEffect on mount.
  // This avoids react-hooks/set-state-in-effect linting errors.

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t("form.errors.name");
    }

    if (!formData.email.trim()) {
      newErrors.email = t("form.errors.email");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("form.errors.emailInvalid");
    }

    if (!formData.subject.trim()) {
      newErrors.subject = t("form.errors.subject");
    }

    if (!formData.message.trim()) {
      newErrors.message = t("form.errors.message");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    startTransition(async () => {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setStatus("success");

        // Reset form after 3 seconds
        setTimeout(() => {
          setFormData({
            name: "",
            email: "",
            subject: "",
            message: "",
          });
          setStatus("idle");
          setErrors({});
        }, 3000);
      } catch (error) {
        console.error("Failed to send message", error);
      }
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: 0.2 }}
      className="h-full"
    >
      <GlassCard className="p-10 h-full relative overflow-hidden rounded-4xl border-foreground/5">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <h2 className="text-3xl font-black text-foreground mb-3 relative z-10 tracking-tight">
          {t("form.title")}
        </h2>
        <p className="text-muted-foreground/60 mb-10 relative z-10 font-medium">
          {t("subtitle")}
        </p>

        {status === "success" ? (
          <div className="bg-primary/10 border border-primary/20 text-primary p-8 rounded-4xl flex flex-col items-center justify-center gap-5 text-lg font-black animate-in fade-in zoom-in duration-500 h-[400px]">
            <div className="p-5 bg-primary/20 rounded-2xl">
              <CheckCircle2 size={56} className="animate-bounce" />
            </div>
            <div className="text-center space-y-3">
              <p className="font-black text-3xl tracking-tight">
                {t("form.successTitle")}
              </p>
              <p className="text-sm text-primary/60 max-w-xs mx-auto font-medium">
                {t("form.successDesc")}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-foreground font-bold text-sm"
                >
                  {t("form.name")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t("form.placeholders.name")}
                  disabled={isPending}
                  className={`bg-foreground/2 dark:bg-white/2 border-foreground/5 dark:border-white/5 text-foreground placeholder:text-muted-foreground/40 focus-visible:border-primary/30 focus-visible:ring-primary/20 h-12 rounded-2xl transition-all duration-300 font-medium ${
                    errors.name ? "border-red-500/50" : ""
                  }`}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs animate-in fade-in duration-200 ml-1">
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-foreground font-bold text-sm"
                >
                  {t("form.email")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t("form.placeholders.email")}
                  disabled={isPending}
                  className={`bg-foreground/2 dark:bg-white/2 border-foreground/5 dark:border-white/5 text-foreground placeholder:text-muted-foreground/40 focus-visible:border-primary/30 focus-visible:ring-primary/20 h-12 rounded-2xl transition-all duration-300 font-medium ${
                    errors.email ? "border-red-500/50" : ""
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs animate-in fade-in duration-200 ml-1">
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="subject"
                className="text-foreground font-bold text-sm"
              >
                {t("form.subject")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder={t("form.placeholders.subject")}
                disabled={isPending}
                className={`bg-foreground/2 dark:bg-white/2 border-foreground/5 dark:border-white/5 text-foreground placeholder:text-muted-foreground/40 focus-visible:border-primary/30 focus-visible:ring-primary/20 h-12 rounded-2xl transition-all duration-300 font-medium ${
                  errors.subject ? "border-red-500/50" : ""
                }`}
              />
              {errors.subject && (
                <p className="text-red-500 text-xs animate-in fade-in duration-200 ml-1">
                  {errors.subject}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="message"
                className="text-foreground font-bold text-sm"
              >
                {t("form.message")} <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder={t("form.placeholders.message")}
                disabled={isPending}
                rows={5}
                className={`bg-foreground/2 dark:bg-white/2 border-foreground/5 dark:border-white/5 text-foreground placeholder:text-muted-foreground/40 focus-visible:border-primary/30 focus-visible:ring-primary/20 rounded-2xl resize-none transition-all duration-300 font-medium ${
                  errors.message ? "border-red-500/50" : ""
                }`}
              />
              {errors.message && (
                <p className="text-red-500 text-xs animate-in fade-in duration-200 ml-1">
                  {errors.message}
                </p>
              )}
            </div>

            <GlassButton
              type="submit"
              disabled={isPending}
              size="lg"
              className="group w-full bg-primary text-primary-foreground hover:opacity-90 border-none shadow-2xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 mt-4 font-black uppercase tracking-widest text-sm rounded-2xl py-4"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {t("form.sending")}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {t("form.submit")}
                  <Send className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </GlassButton>
          </form>
        )}
      </GlassCard>
    </m.div>
  );
}
