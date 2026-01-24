"use client";

import { BackgroundBlob } from "@/components/shared/background-blob";
import { GlassButton } from "@/components/shared/glass-button";
import { OptimizedImage } from "@/components/shared/optimized-image";
import { useRouter } from "@/i18n/routing";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { m } from "framer-motion";


export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const t = useTranslations("auth.login"); // Defaulting to login trans for hero, or make generic
  const tCommon = useTranslations("common");

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2 overflow-hidden bg-background relative selection:bg-accent/30">
      {/* Cinematic Background & Aurora Glow */}
      <div className="absolute inset-0 bg-cinematic pointer-events-none z-0 opacity-40" />
      <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-(--aurora-blue)/15 rounded-full blur-[150px] animate-pulse-glow z-0 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-(--aurora-purple)/10 rounded-full blur-[120px] animate-float z-0 pointer-events-none" />

      {/* Left Side - Image */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-muted relative overflow-hidden h-full z-10 border-r border-white/5">
        <OptimizedImage
          src="/images/auth-hero-luxury.png"
          alt="Authentication Background"
          fill
          containerClassName="w-full h-full scale-105"
          className="object-cover opacity-60"
          priority
          showShimmer={true}
        />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-background/20 to-background/80" />
        
        {/* Centered Text */}
        <div className="relative z-10 p-16 max-w-xl space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-premium border border-white/10 text-accent text-[10px] font-black uppercase tracking-[0.4em]">
            <div className="size-1.5 rounded-full bg-accent animate-pulse" />
            <span>Exclusive Membership</span>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-6xl font-bold tracking-tighter uppercase leading-none bg-clip-text text-transparent bg-linear-to-b from-white to-white/40">
              {t("heroTitle")}
            </h2>
            <p className="text-xl text-white/60 font-medium leading-relaxed max-w-md italic font-serif">
              "{t("heroSubtitle")}"
            </p>
          </div>

          <div className="flex items-center gap-6 pt-8 border-t border-white/10">
            <div className="space-y-1">
              <p className="text-2xl font-black tracking-tighter">50K+</p>
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Curated Items</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="space-y-1">
              <p className="text-2xl font-black tracking-tighter">100%</p>
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Authenticity</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form Content */}
      <div className="flex items-center justify-center p-8 lg:p-12 h-full relative z-20">
        {/* Back Button */}
        <div className="absolute top-8 left-8 lg:left-12 z-50">
          <m.button
            whileHover={{ x: -4 }}
            onClick={() => router.push("/")}
            className="group flex items-center gap-3 px-4 py-2 rounded-2xl glass-premium border border-white/10 hover:bg-white/5 transition-all"
          >
            <div className="size-8 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 group-hover:opacity-100 transition-opacity">
              {tCommon("back")}
            </span>
          </m.button>
        </div>

        {/* Children (The Form) */}
        <div className="w-full max-w-md relative">
          <div className="absolute -inset-24 bg-accent/5 rounded-full blur-[100px] pointer-events-none -z-10" />
          {children}
        </div>
      </div>
    </div>
  );
}
