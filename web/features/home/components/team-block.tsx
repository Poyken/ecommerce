"use client";

/**
 * =====================================================================
 * TEAM BLOCK - Giới thiệu đội ngũ
 * =====================================================================
 */

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import Image from "next/image";
import type { BaseBlockProps, TeamMember } from "../types/block-types";

interface TeamBlockProps extends BaseBlockProps {
  title?: string;
  subtitle?: string;
  members?: TeamMember[];
  layout?: "grid" | "carousel" | "masonry";
  columns?: 2 | 3 | 4;
  showSocialLinks?: boolean;
  cardStyle?: "minimal" | "bordered" | "elevated";
  alignment?: "left" | "center" | "right";
}

const defaultMembers: TeamMember[] = [
  {
    name: "Nguyễn Văn A",
    role: "CEO & Founder",
    avatar: "/images/team/avatar-1.jpg",
    bio: "10+ năm kinh nghiệm trong lĩnh vực E-commerce",
    socialLinks: [
      { platform: "linkedin", url: "#" },
      { platform: "twitter", url: "#" },
    ],
  },
  {
    name: "Trần Thị B",
    role: "CTO",
    avatar: "/images/team/avatar-2.jpg",
    bio: "Chuyên gia công nghệ với background từ Google",
    socialLinks: [
      { platform: "linkedin", url: "#" },
      { platform: "instagram", url: "#" },
    ],
  },
  {
    name: "Lê Văn C",
    role: "Head of Design",
    avatar: "/images/team/avatar-3.jpg",
    bio: "Đam mê tạo ra những trải nghiệm đẹp mắt",
    socialLinks: [
      { platform: "instagram", url: "#" },
      { platform: "twitter", url: "#" },
    ],
  },
  {
    name: "Phạm Thị D",
    role: "Head of Marketing",
    avatar: "/images/team/avatar-4.jpg",
    bio: "Chiến lược gia marketing với nhiều chiến dịch thành công",
    socialLinks: [
      { platform: "linkedin", url: "#" },
      { platform: "facebook", url: "#" },
    ],
  },
];

const socialIcons = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: () => null,
  tiktok: () => null,
  pinterest: () => null,
};

export function TeamBlock({
  title = "Đội ngũ của chúng tôi",
  subtitle = "Những con người tài năng đứng sau thành công của platform",
  members = defaultMembers,
  layout = "grid",
  columns = 4,
  showSocialLinks = true,
  cardStyle = "elevated",
  alignment = "center",
}: TeamBlockProps) {
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  };

  const cardStyles = {
    minimal: "bg-transparent",
    bordered: "bg-card border border-border",
    elevated: "bg-card shadow-lg hover:shadow-xl transition-shadow",
  };

  const alignmentClasses = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  };

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={cn(
            "max-w-3xl mb-12",
            alignment === "center" && "mx-auto text-center"
          )}
        >
          {title && (
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-lg text-muted-foreground">{subtitle}</p>
          )}
        </motion.div>

        {/* Team Grid */}
        <div className={cn("grid gap-6 lg:gap-8", gridCols[columns])}>
          {members.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "group rounded-2xl p-6 flex flex-col",
                cardStyles[cardStyle],
                alignmentClasses[alignment]
              )}
            >
              {/* Avatar */}
              <div className="relative w-24 h-24 lg:w-32 lg:h-32 rounded-full overflow-hidden mb-4 bg-muted">
                {member.avatar ? (
                  <Image
                    src={member.avatar}
                    alt={member.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-muted-foreground">
                    {member.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Info */}
              <h3 className="text-lg font-semibold">{member.name}</h3>
              <p className="text-sm text-primary font-medium mb-2">
                {member.role}
              </p>
              {member.bio && (
                <p className="text-sm text-muted-foreground mb-4">
                  {member.bio}
                </p>
              )}

              {/* Social Links */}
              {showSocialLinks && member.socialLinks && (
                <div className="flex gap-3 mt-auto">
                  {member.socialLinks.map((link) => {
                    const Icon = socialIcons[link.platform];
                    if (!Icon) return null;
                    return (
                      <a
                        key={link.platform}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <Icon className="size-4" />
                      </a>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
