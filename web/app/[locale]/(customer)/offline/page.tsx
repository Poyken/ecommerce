import { GlassCard } from "@/components/shared/glass-card";
import { OptimizedImage } from "@/components/shared/optimized-image";
import { Link } from "@/i18n/routing";
import { WifiOff } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function OfflinePage() {
  const t = await getTranslations("common");

  return (
    <div className="min-h-screen bg-background relative overflow-hidden transition-colors duration-500 font-sans flex flex-col items-center justify-center p-4">
      {/* Cinematic Background & Aurora Glow */}
      <div className="fixed inset-0 bg-cinematic pointer-events-none z-0 opacity-40" />
      <div className="fixed top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-(--aurora-blue)/15 rounded-full blur-[150px] animate-pulse-glow z-0 pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-(--aurora-purple)/15 rounded-full blur-[150px] animate-float z-0 pointer-events-none" />

      <GlassCard className="max-w-md w-full p-12 text-center space-y-8 animate-in fade-in zoom-in duration-700 relative z-10 border-none shadow-2xl">
        <div className="relative w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <WifiOff className="w-12 h-12 text-primary animate-pulse" />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tighter uppercase leading-none bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/40">
            {t("offline.title")}
          </h1>
          <p className="text-muted-foreground leading-relaxed font-medium">
            {t("offline.description")}
          </p>
        </div>

        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex h-14 items-center justify-center rounded-2xl bg-primary px-10 text-xs font-black uppercase tracking-[0.2em] text-primary-foreground transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/20"
          >
            {t("offline.refresh")}
          </Link>
        </div>

        <p className="text-[10px] text-muted-foreground/40 uppercase font-black tracking-[0.3em]">
          {t("offline.footer")}
        </p>
      </GlassCard>
    </div>
  );
}
