"use client";

import { GlassButton } from "@/components/shared/glass-button";
import { Link, useRouter } from "@/i18n/routing";
import confetti from "canvas-confetti";
import { m } from "@/lib/animations";
import { Check, Package, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function CheckoutSuccessPage() {
  const t = useTranslations("checkout.success");
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const router = useRouter();

  // Redirect to home if no orderId
  useEffect(() => {
    if (!orderId) {
      router.push("/");
    } else {
      // Trigger confetti
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);
    }
  }, [orderId, router]);

  if (!orderId) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-success/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-info/10 rounded-full blur-[150px] pointer-events-none" />

      <m.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl relative z-10 text-center"
      >
        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
          <Check className="w-10 h-10 text-white" strokeWidth={3} />
        </div>

        <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-muted-foreground mb-8">{t("description")}</p>

        <div className="bg-muted/30 rounded-xl p-4 mb-8 border border-border/50">
          <p className="text-sm text-muted-foreground mb-1">
            {t("orderNumber")}
          </p>
          <p className="text-xl font-mono font-bold tracking-wider">
            #{orderId.slice(0, 8).toUpperCase()}
          </p>
        </div>

        <div className="space-y-3">
          <Link href={`/orders/${orderId}`} className="block w-full">
            <GlassButton
              className="w-full bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
              size="lg"
            >
              <Package className="mr-2 h-5 w-5" />
              {t("viewOrder")}
            </GlassButton>
          </Link>

          <Link href="/" className="block w-full">
            <GlassButton className="w-full" variant="outline" size="lg">
              <ShoppingBag className="mr-2 h-5 w-5" />
              {t("continueShopping")}
            </GlassButton>
          </Link>
        </div>
      </m.div>
    </div>
  );
}
