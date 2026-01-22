"use client";

import { forgotPasswordAction } from "@/features/auth/actions";
import { GlassButton } from "@/components/shared/glass-button";
import { GlassCard } from "@/components/shared/glass-card";
import { AnimatedError } from "@/components/shared/animated-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "@/i18n/routing";
import { forgotPasswordSchema } from "@/lib/schemas";
import { m } from "@/lib/animations";
import { AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useState } from "react";



export function ForgotPasswordPageContent() {
  const t = useTranslations("auth.forgotPassword");
  const tToast = useTranslations("common.toast");
  const [state, action, isPending] = useActionState(async (prevState: any, formData: FormData) => {
    const email = formData.get("email") as string;
    return forgotPasswordAction({ email });
  }, null);
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

      if ((state as any).errors) {
        requestAnimationFrame(() => setLocalErrors((state as any).errors || {}));
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
        <div className="mb-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-premium border border-white/10 text-accent text-[10px] font-black uppercase tracking-[0.3em] mx-auto">
            <div className="size-1.5 rounded-full bg-accent animate-pulse" />
            <span>Identity Request</span>
          </div>
          <h1 className="text-5xl font-bold tracking-tighter text-foreground uppercase leading-none">
            {t("title")}
          </h1>
          <p className="text-muted-foreground/60 font-serif italic text-lg leading-none">
            Restoring your luxury access
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
                {(state as any).message}
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
          <m.form layout action={handleAction} className="space-y-6" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/80 font-bold">
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
              <AnimatedError message={localErrors.email?.[0]} />
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
          </m.form>
        )}
      </GlassCard>
    </m.div>
  );
}
