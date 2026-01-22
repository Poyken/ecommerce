"use client";

import { GlassButton } from "@/components/shared/glass-button";
import { GlassCard } from "@/components/shared/glass-card";
import { AnimatedError } from "@/components/shared/animated-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { m } from "@/lib/animations";
import { CheckCircle2, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { sendMessage } from "../actions";
import { useToast } from "@/components/ui/use-toast";



export function ContactForm() {
  const t = useTranslations("contact");
  const tToast = useTranslations("common.toast");
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const { execute, isExecuting, result, reset } = useAction(sendMessage, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        toast({
          variant: "success",
          title: tToast("success"),
          description: t("form.successDesc"),
        });
        
        // Reset form after 5 seconds
        setTimeout(() => {
          setFormData({ name: "", email: "", subject: "", message: "" });
          reset();
        }, 5000);
      }
    },
    onError: ({ error }) => {
      toast({
        variant: "destructive",
        title: tToast("error"),
        description: error.serverError || t("form.errors.failed"),
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    execute(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isSuccess = result.data?.success;
  const fieldErrors = result.validationErrors;

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: 0.2 }}
      className="h-full"
    >
      <GlassCard className="p-10 h-full relative overflow-hidden rounded-4xl border-foreground/5 dark:border-white/5">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <h2 className="text-3xl font-editorial-bold text-foreground mb-3 relative z-10 tracking-tight">
          {t("form.title")}
        </h2>
        <p className="text-muted-foreground/60 mb-10 relative z-10 font-medium">
          {t("subtitle")}
        </p>

        {isSuccess ? (
          <div className="bg-primary/10 border border-primary/20 text-primary p-8 rounded-4xl flex flex-col items-center justify-center gap-5 text-lg font-black animate-in fade-in zoom-in duration-500 h-[400px] backdrop-blur-sm">
            <div className="p-5 bg-primary/20 rounded-2xl">
              <CheckCircle2 size={56} className="animate-bounce" />
            </div>
            <div className="text-center space-y-3">
              <p className="font-editorial-bold text-3xl tracking-tight">
                {t("form.successTitle")}
              </p>
              <p className="text-sm text-primary/60 max-w-xs mx-auto font-medium">
                {t("form.successDesc")}
              </p>
            </div>
            <GlassButton 
              onClick={() => reset()}
              variant="outline"
              className="mt-4 rounded-xl font-bold uppercase tracking-widest text-xs"
            >
              {t("form.sendAnother")}
            </GlassButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground font-bold text-sm">
                  {t("form.name")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t("form.placeholders.name")}
                  disabled={isExecuting}
                  className={`bg-foreground/2 dark:bg-white/2 border-foreground/5 dark:border-white/5 text-foreground placeholder:text-muted-foreground/40 focus-visible:border-primary/30 focus-visible:ring-primary/20 h-12 rounded-2xl transition-all duration-300 font-medium ${
                    fieldErrors?.name ? "border-red-500/50" : ""
                  }`}
                />
                <AnimatedError message={fieldErrors?.name?._errors?.[0] ? t(fieldErrors.name._errors[0] as any) : undefined} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-bold text-sm">
                  {t("form.email")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t("form.placeholders.email")}
                  disabled={isExecuting}
                  className={`bg-foreground/2 dark:bg-white/2 border-foreground/5 dark:border-white/5 text-foreground placeholder:text-muted-foreground/40 focus-visible:border-primary/30 focus-visible:ring-primary/20 h-12 rounded-2xl transition-all duration-300 font-medium ${
                    fieldErrors?.email ? "border-red-500/50" : ""
                  }`}
                />
                <AnimatedError message={fieldErrors?.email?._errors?.[0] ? t(fieldErrors.email._errors[0] as any) : undefined} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject" className="text-foreground font-bold text-sm">
                {t("form.subject")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder={t("form.placeholders.subject")}
                disabled={isExecuting}
                className={`bg-foreground/2 dark:bg-white/2 border-foreground/5 dark:border-white/5 text-foreground placeholder:text-muted-foreground/40 focus-visible:border-primary/30 focus-visible:ring-primary/20 h-12 rounded-2xl transition-all duration-300 font-medium ${
                  fieldErrors?.subject ? "border-red-500/50" : ""
                }`}
              />
              <AnimatedError message={fieldErrors?.subject?._errors?.[0] ? t(fieldErrors.subject._errors[0] as any) : undefined} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-foreground font-bold text-sm">
                {t("form.message")} <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder={t("form.placeholders.message")}
                disabled={isExecuting}
                rows={5}
                className={`bg-foreground/2 dark:bg-white/2 border-foreground/5 dark:border-white/5 text-foreground placeholder:text-muted-foreground/40 focus-visible:border-primary/30 focus-visible:ring-primary/20 rounded-2xl resize-none transition-all duration-300 font-medium ${
                  fieldErrors?.message ? "border-red-500/50" : ""
                }`}
              />
              <AnimatedError message={fieldErrors?.message?._errors?.[0] ? t(fieldErrors.message._errors[0] as any) : undefined} />
            </div>

            <GlassButton
              type="submit"
              disabled={isExecuting}
              size="lg"
              className="group w-full bg-primary text-primary-foreground hover:opacity-90 border-none shadow-2xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 mt-4 font-black uppercase tracking-widest text-sm rounded-2xl py-4"
            >
              {isExecuting ? (
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

