"use client";

import { GlassButton } from "@/components/atoms/glass-button";
import { useRouter } from "@/i18n/routing";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const t = useTranslations("common");

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute top-8 left-8 lg:left-[calc(50%+2rem)] z-50">
        <GlassButton
          variant="secondary"
          size="md"
          onClick={() => router.push("/")}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          {t("back")}
        </GlassButton>
      </div>
      {children}
    </div>
  );
}
