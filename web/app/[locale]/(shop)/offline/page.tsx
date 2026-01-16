import { GlassCard } from "@/components/shared/glass-card";
import { OptimizedImage } from "@/components/shared/optimized-image";
import { Link } from "@/i18n/routing";
import { WifiOff } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function OfflinePage() {
  const t = await getTranslations("common");

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <GlassCard className="max-w-md w-full p-8 text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="relative w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <WifiOff className="w-12 h-12 text-primary animate-pulse" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight uppercase">
            {t("offline.title")}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            {t("offline.description")}
          </p>
        </div>

        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-bold uppercase tracking-widest text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105 active:scale-95"
          >
            {t("offline.refresh")}
          </Link>
        </div>

        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
          {t("offline.footer")}
        </p>
      </GlassCard>
    </div>
  );
}
