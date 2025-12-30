/**
 * =====================================================================
 * CONTACT INFO CARDS - Các thẻ thông tin liên hệ (Email, Phone, Address)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. STAGGERED ANIMATION:
 * - Sử dụng `staggerChildren` để các thẻ thông tin xuất hiện lần lượt, tạo hiệu ứng thị giác chuyên nghiệp.
 *
 * 2. VISUAL CONSISTENCY:
 * - Mỗi thẻ sử dụng `GlassCard` với icon và màu sắc đồng bộ, giúp người dùng dễ dàng nhận diện thông tin.
 * =====================================================================
 */

"use client";

import { GlassCard } from "@/components/shared/glass-card";
import { cn } from "@/lib/utils";
import { m } from "@/lib/animations";
import { Mail, MapPin, Phone } from "lucide-react";
import { useTranslations } from "next-intl";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface ContactInfoCardsProps {
  className?: string;
}

export function ContactInfoCards({ className }: ContactInfoCardsProps) {
  const t = useTranslations("contact");

  const cards = [
    {
      icon: Mail,
      title: t("email"),
      lines: [t("info.email"), t("info.salesEmail")],
      color: "accent",
      bg: "bg-accent/10",
      text: "text-accent",
      border: "hover:border-accent/20",
      shadow: "hover:shadow-accent/10",
    },
    {
      icon: Phone,
      title: t("phone"),
      lines: [t("info.phone"), t("info.hours")],
      color: "accent",
      bg: "bg-accent/10",
      text: "text-accent",
      border: "hover:border-accent/20",
      shadow: "hover:shadow-accent/10",
    },
    {
      icon: MapPin,
      title: t("address"),
      lines: [t("info.address")],
      color: "accent",
      bg: "bg-accent/10",
      text: "text-accent",
      border: "hover:border-accent/20",
      shadow: "hover:shadow-accent/10",
    },
  ];

  return (
    <m.div
      className={cn("grid grid-cols-1 md:grid-cols-3 gap-8 mb-16", className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={containerVariants}
    >
      {cards.map((card, index) => (
        <m.div key={index} variants={itemVariants} className="h-full">
          <GlassCard
            className={`p-6 h-full hover:scale-105 transition-all duration-500 hover:shadow-2xl ${card.shadow} border border-foreground/5 ${card.border} flex flex-col items-center text-center group rounded-3xl`}
          >
            <div
              className={`p-3 rounded-2xl ${card.bg} ${card.text} mb-4 group-hover:scale-110 transition-transform duration-500 shadow-lg`}
            >
              <card.icon className="w-6 h-6" />
            </div>
            <h3 className="font-black text-foreground mb-2 text-base tracking-tight uppercase">
              {card.title}
            </h3>
            {card.lines.map((line, i) => (
              <p
                key={i}
                className="text-sm text-muted-foreground/70 font-medium leading-relaxed"
              >
                {line}
              </p>
            ))}
          </GlassCard>
        </m.div>
      ))}
    </m.div>
  );
}
