"use client";

import { GlassCard } from "@/components/atoms/glass-card";
import { ProgressiveImage } from "@/components/atoms/progressive-image";
import { Skeleton } from "@/components/atoms/skeleton";
import { Link } from "@/i18n/routing";
import {
  fadeInLeft,
  fadeInRight,
  fadeInUp,
  itemVariant,
  staggerContainer,
} from "@/lib/animations";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, ShieldCheck, Truck, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";

/**
 * =====================================================================
 * ABOUT PAGE CONTENT - Nội dung trang giới thiệu
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. VISUAL STORYTELLING:
 * - Sử dụng hình ảnh chất lượng cao từ Unsplash kết hợp với `opacity` và `gradient` để tạo chiều sâu.
 * - `motion.div` từ Framer Motion giúp các đoạn text xuất hiện mượt mà, tạo cảm giác cao cấp.
 *
 * 2. ANIMATION VARIANTS:
 * - Sử dụng các animation variants từ `@/lib/animations` thay vì inline.
 * - Giúp code sạch hơn và dễ maintain hơn.
 *
 * 3. HERO LOADING STATE:
 * - Hero section có loading state riêng - hiển thị shimmer cho đến khi ảnh load xong.
 * - Content chỉ fade in sau khi ảnh đã sẵn sàng.
 * =====================================================================
 */

export function AboutPageContent() {
  const t = useTranslations("about");
  const [isHeroReady, setIsHeroReady] = useState(false);

  // Preload hero image using JS Image constructor for reliable timing
  useEffect(() => {
    const img = new window.Image();
    img.src = "/images/about/hero.webp";
    img.onload = () => {
      // Small delay to ensure smooth transition
      setTimeout(() => setIsHeroReady(true), 100);
    };
    // If image is already cached
    if (img.complete) {
      setTimeout(() => setIsHeroReady(true), 100);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30  overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image - shows after preloaded */}
        <AnimatePresence>
          {isHeroReady && (
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0, filter: "blur(20px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            >
              <Image
                src="/images/about/hero.webp"
                alt="About Us Hero"
                fill
                className="object-cover opacity-60"
                priority
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-linear-to-b from-background/20 via-background/60 to-background" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skeleton while loading - for both background AND text */}
        <AnimatePresence>
          {!isHeroReady && (
            <motion.div
              className="absolute inset-0 z-20"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Background skeleton */}
              <Skeleton className="absolute inset-0 rounded-none" />
              {/* Text skeletons */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="container px-4 text-center space-y-6 flex flex-col items-center">
                  <Skeleton className="h-8 w-40 rounded-full" />
                  <Skeleton className="h-16 w-96 max-w-full" />
                  <Skeleton className="h-8 w-[500px] max-w-full" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actual content - only animate in after image is loaded */}
        <AnimatePresence>
          {isHeroReady && (
            <motion.div
              className="container relative z-10 px-4 text-center space-y-6"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-xl border border-primary/30 text-xs font-black uppercase tracking-widest text-primary shadow-lg shadow-primary/10"
                variants={fadeInUp}
              >
                <span>{t("established")}</span>
              </motion.div>
              <motion.h1
                className="text-6xl md:text-8xl font-black tracking-tighter text-foreground"
                variants={fadeInUp}
              >
                {t("weAre")}{" "}
                <span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-accent to-primary animate-gradient-x">
                  {t("visionaries")}
                </span>
              </motion.h1>
              <motion.p
                className="text-xl md:text-2xl text-muted-foreground/70 max-w-3xl mx-auto font-medium leading-relaxed"
                variants={fadeInUp}
              >
                {t("heroSubtitle")}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <div className="container mx-auto px-4 py-24 space-y-32">
        {/* Mission & Vision */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            className="space-y-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInLeft}
          >
            <div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                {t("missionTitle")}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t("missionDesc")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {[
                {
                  label: t("stat1Label"),
                  value: "50K+",
                  color: "text-primary",
                },
                {
                  label: t("stat2Label"),
                  value: "100+",
                  color: "text-accent",
                },
                {
                  label: t("stat3Label"),
                  value: "24/7",
                  color: "text-primary",
                },
                {
                  label: t("stat4Label"),
                  value: "4.9/5",
                  color: "text-accent",
                },
              ].map((stat, i) => (
                <div key={i} className="space-y-2">
                  <h3 className={`text-4xl font-black ${stat.color}`}>
                    {stat.value}
                  </h3>
                  <p className="text-sm text-muted-foreground/70 font-medium">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div
            className="relative aspect-square rounded-[2.5rem] overflow-hidden border border-foreground/5 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-700"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInRight}
          >
            <ProgressiveImage
              src="/images/about/mission.webp"
              alt="Our Mission"
              fill
              className="object-cover"
              wrapperClassName="absolute inset-0"
            />
          </motion.div>
        </section>

        {/* Core Values */}
        <section>
          <motion.h2
            className="text-4xl md:text-5xl font-black tracking-tight text-center mb-20 bg-clip-text text-transparent bg-linear-to-r from-primary via-accent to-primary"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            {t("coreValues")}
          </motion.h2>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              {
                icon: ShieldCheck,
                title: t("secureShopping"),
                desc: t("secureShoppingDesc"),
                color: "amber",
              },
              {
                icon: Truck,
                title: t("fastDelivery"),
                desc: t("fastDeliveryDesc"),
                color: "amber",
              },
              {
                icon: Heart,
                title: t("customerLove"),
                desc: t("customerLoveDesc"),
                color: "amber",
              },
              {
                icon: Users,
                title: t("community"),
                desc: t("communityDesc"),
                color: "amber",
              },
            ].map(
              (
                item: {
                  icon: React.ElementType;
                  title: string;
                  desc: string;
                  color: string;
                },
                i
              ) => (
                <motion.div key={i} variants={itemVariant} className="h-full">
                  <GlassCard
                    className={`h-full p-8 space-y-4 hover:bg-white/5 transition-all duration-150 group border border-transparent hover:shadow-lg ${
                      item.color === "primary"
                        ? "hover:border-primary/30 hover:shadow-primary/10"
                        : "hover:border-accent/30 hover:shadow-accent/10"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                        item.color === "primary"
                          ? "bg-primary/10 text-primary group-hover:bg-primary/20"
                          : "bg-accent/10 text-accent group-hover:bg-accent/20"
                      }`}
                    >
                      <item.icon size={24} />
                    </div>
                    <h3 className="text-xl font-bold">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                  </GlassCard>
                </motion.div>
              )
            )}
          </motion.div>
        </section>

        {/* Team Section */}
        <section className="space-y-16">
          <motion.div
            className="text-center max-w-2xl mx-auto space-y-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-4xl font-bold tracking-tight">
              {t("meetTeam")}
            </h2>
            <p className="text-muted-foreground">{t("teamSubtitle")}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Alex Morgan",
                role: "Founder & CEO",
                image: "/images/about/team-alex.webp",
              },
              {
                name: "Sarah Chen",
                role: "Head of Design",
                image: "/images/about/team-sarah.webp",
              },
              {
                name: "Marcus Johnson",
                role: "Lead Developer",
                image: "/images/about/team-marcus.webp",
              },
            ].map((member, i) => (
              <motion.div
                key={i}
                className="group relative"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={itemVariant}
              >
                <div className="relative aspect-3/4 rounded-2xl overflow-hidden mb-4">
                  <ProgressiveImage
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover grayscale-0 md:grayscale md:group-hover:grayscale-0 transition-all duration-500"
                    wrapperClassName="absolute inset-0"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6 z-20">
                    <div className="transform translate-y-0 md:translate-y-4 md:group-hover:translate-y-0 transition-transform duration-300">
                      <p className="text-white font-medium">
                        &ldquo;{t("teamQuote")}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-bold">{member.name}</h3>
                <p className="text-primary text-sm font-medium">
                  {member.role}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <motion.section
          className="relative rounded-[2.5rem] overflow-hidden border border-primary/20 shadow-2xl shadow-primary/5"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-accent/10 to-primary/10" />
          <div className="relative p-12 md:p-24 text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              {t("readyToJoin")}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("ctaSubtitle")}
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-black transition-all shadow-xl shadow-primary/20"
              >
                {t("shopNow")}
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center h-12 px-8 rounded-full border border-primary/20 bg-background/50 hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all font-bold"
              >
                {t("contactUs")}
              </Link>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
