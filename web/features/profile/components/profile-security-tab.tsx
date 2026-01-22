

"use client";

import { GlassButton } from "@/components/shared/glass-button";
import { GlassCard } from "@/components/shared/glass-card";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    disableTwoFactorAction,
    enableTwoFactorAction,
    generateTwoFactorAction,
} from "@/features/profile/actions";
import { m } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";
import { Check, Copy, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState, useTransition } from "react";

interface ProfileSecurityTabProps {
  user: {
    twoFactorEnabled?: boolean;
    email: string;
  };
}

export function ProfileSecurityTab({ user }: ProfileSecurityTabProps) {
  const t = useTranslations("profile.security");
  const tCommon = useTranslations("common");
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [qrData, setQrData] = useState<{
    secret: string;
    qrCode: string;
  } | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    startTransition(async () => {
      const res = await generateTwoFactorAction();
      if (res.success && res.data) {
        setQrData(res.data);
        toast({
          variant: "success",
          title: tCommon("toast.success"),
          description: t("twoFactor.successGenerated"),
        });
      } else {
        toast({
          variant: "destructive",
          title: tCommon("toast.error"),
          description: res.error || tCommon("toast.error"),
        });
      }
    });
  };

  const handleEnable = () => {
    if (!qrData || otpCode.length < 6) return;
    startTransition(async () => {
      const res = await enableTwoFactorAction(otpCode, qrData.secret);
      if (res.success) {
        toast({
          variant: "success",
          title: tCommon("toast.success"),
          description: t("twoFactor.successEnabled"),
        });
        setQrData(null);
        setOtpCode("");
      } else {
        toast({
          variant: "destructive",
          title: tCommon("toast.error"),
          description: res.error || t("twoFactor.errorInvalidCode"),
        });
      }
    });
  };

  const handleDisable = () => {
    if (otpCode.length < 6) return;
    startTransition(async () => {
      const res = await disableTwoFactorAction(otpCode);
      if (res.success) {
        toast({
          variant: "success",
          title: tCommon("toast.success"),
          description: t("twoFactor.successDisabled"),
        });
        setOtpCode("");
      } else {
        toast({
          variant: "destructive",
          title: tCommon("toast.error"),
          description: res.error || t("twoFactor.errorInvalidCode"),
        });
      }
    });
  };

  const copyToClipboard = () => {
    if (qrData?.secret) {
      navigator.clipboard.writeText(qrData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <GlassCard className="p-6 md:p-8 backdrop-blur-md border-white/10">
        <div className="mb-8 space-y-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
            {user.twoFactorEnabled ? (
              <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> {t("twoFactor.enabled")}
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-bold border border-yellow-500/20 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> {t("twoFactor.disabled")}
              </span>
            )}
          </div>
          <p className="text-base text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="space-y-8">
          {/* STATUS CARD */}
          <div
            className={cn(
              "p-6 rounded-2xl border flex flex-col md:flex-row items-center gap-6 text-center md:text-left",
              user.twoFactorEnabled
                ? "bg-green-500/5 border-green-500/20"
                : "bg-yellow-500/5 border-yellow-500/20"
            )}
          >
            <div
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center shrink-0",
                user.twoFactorEnabled
                  ? "bg-green-500/10 text-green-500"
                  : "bg-yellow-500/10 text-yellow-500"
              )}
            >
              {user.twoFactorEnabled ? (
                <ShieldCheck size={32} />
              ) : (
                <Shield size={32} />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-bold text-lg">
                {user.twoFactorEnabled
                  ? t("twoFactor.enabled") // Using Enabled as title or similar
                  : t("twoFactor.disabled")}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t("twoFactor.description")}
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!user.twoFactorEnabled && !qrData && (
              <m.div
                key="enable-start"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <GlassButton
                  onClick={handleGenerate}
                  disabled={isPending}
                  className="w-full md:w-auto bg-primary text-primary-foreground font-bold h-12 px-8"
                >
                  {isPending ? tCommon("loading") : t("twoFactor.enable")}
                </GlassButton>
              </m.div>
            )}

            {!user.twoFactorEnabled && qrData && (
              <m.div
                key="enable-qr"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-6"
              >
                <div className="grid md:grid-cols-2 gap-8">
                  {/* QR Code */}
                  <div className="flex flex-col items-center space-y-4 p-6 bg-white/5 rounded-2xl border border-white/10">
                    <div className="bg-white p-4 rounded-xl">
                      <Image
                        src={qrData.qrCode}
                        alt="2FA QR Code"
                        width={200}
                        height={200}
                        className="rounded-lg"
                      />
                    </div>
                    <p className="text-sm text-center text-muted-foreground">
                      {t("twoFactor.scanQr")}
                    </p>
                  </div>

                  {/* Secret Key & Input */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>{t("twoFactor.manualSecret")}</Label>
                      <div className="flex gap-2">
                        <code className="flex-1 bg-black/20 p-3 rounded-lg border border-white/10 font-mono text-sm break-all">
                          {qrData.secret}
                        </code>
                        <button
                          onClick={copyToClipboard}
                          title={t("twoFactor.copySecret")}
                          className="p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
                        >
                          {copied ? (
                            <Check size={18} className="text-green-500" />
                          ) : (
                            <Copy size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{t("twoFactor.otpLabel")}</Label>
                      <Input
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder={t("twoFactor.otpPlaceholder")}
                        maxLength={6}
                        className="text-center text-xl tracking-widest font-mono h-12"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <GlassButton
                        onClick={handleEnable}
                        disabled={otpCode.length < 6 || isPending}
                        className="flex-1 bg-primary text-primary-foreground font-bold h-12"
                      >
                        {isPending
                          ? tCommon("loading")
                          : t("twoFactor.confirmEnable")}
                      </GlassButton>
                      <GlassButton
                        onClick={() => setQrData(null)}
                        variant="ghost"
                        className="h-12 px-6"
                      >
                        {tCommon("cancel")}
                      </GlassButton>
                    </div>
                  </div>
                </div>
              </m.div>
            )}

            {user.twoFactorEnabled && (
              <m.div
                key="disable"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 pt-4 border-t border-white/10"
              >
                <h3 className="font-bold text-lg text-red-500">
                  {t("twoFactor.disable")}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {t("twoFactor.description")}
                </p>

                <div className="max-w-md space-y-4">
                  <Input
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder={t("twoFactor.otpPlaceholder")}
                    maxLength={6}
                    className="text-center text-xl tracking-widest font-mono h-12"
                  />
                  <GlassButton
                    onClick={handleDisable}
                    disabled={otpCode.length < 6 || isPending}
                    className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20 font-bold h-12"
                  >
                    {isPending
                      ? tCommon("loading")
                      : t("twoFactor.confirmDisable")}
                  </GlassButton>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </GlassCard>
    </m.div>
  );
}
