"use client";

/**
 * =====================================================================
 * IMAGE TEXT BLOCK - Layout 2 cột với hình ảnh và nội dung text
 * =====================================================================
 */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { BaseBlockProps, CTAButton } from "../types/block-types";

interface ImageTextBlockProps extends BaseBlockProps {
  title?: string;
  subtitle?: string;
  content?: string;
  image?: string;
  imageAlt?: string;
  imagePosition?: "left" | "right";
  imageStyle?: "rounded" | "square" | "circle" | "blob";
  ctaButton?: CTAButton;
  secondaryButton?: CTAButton;
  badges?: string[];
  verticalAlign?: "top" | "center" | "bottom";
  contentWidth?: "narrow" | "medium" | "wide";
  showDecorations?: boolean;
}

export function ImageTextBlock({
  title = "Xây dựng cửa hàng trong vài phút",
  subtitle,
  content = "Platform của chúng tôi cung cấp tất cả công cụ bạn cần để khởi tạo và vận hành một cửa hàng thương mại điện tử chuyên nghiệp. Từ quản lý sản phẩm, đơn hàng đến marketing tự động.",
  image = "/images/home/feature-image.jpg",
  imageAlt = "Feature Image",
  imagePosition = "left",
  imageStyle = "rounded",
  ctaButton = { text: "Bắt đầu ngay", link: "/register" },
  secondaryButton,
  badges,
  verticalAlign = "center",
  contentWidth = "medium",
  showDecorations = true,
}: ImageTextBlockProps) {
  const alignments = {
    top: "items-start",
    center: "items-center",
    bottom: "items-end",
  };

  const contentWidths = {
    narrow: "max-w-sm",
    medium: "max-w-md",
    wide: "max-w-lg",
  };

  const imageStyles = {
    rounded: "rounded-2xl",
    square: "rounded-none",
    circle: "rounded-full aspect-square",
    blob: "rounded-[30%_70%_70%_30%/30%_30%_70%_70%]",
  };

  const ImageSection = (
    <motion.div
      initial={{ opacity: 0, x: imagePosition === "left" ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative"
    >
      {/* Decorative Elements */}
      {showDecorations && (
        <>
          <div
            className={cn(
              "absolute -z-10 w-full h-full rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5",
              imagePosition === "left"
                ? "-bottom-4 -right-4"
                : "-bottom-4 -left-4"
            )}
          />
          <div
            className={cn(
              "absolute -z-20 size-32 rounded-full bg-primary/10 blur-3xl",
              imagePosition === "left" ? "-top-8 -left-8" : "-top-8 -right-8"
            )}
          />
        </>
      )}

      {/* Image */}
      <div
        className={cn(
          "relative overflow-hidden",
          imageStyle === "circle" ? "aspect-square" : "aspect-[4/3]",
          imageStyles[imageStyle]
        )}
      >
        <Image src={image} alt={imageAlt} fill className="object-cover" />
      </div>
    </motion.div>
  );

  const ContentSection = (
    <motion.div
      initial={{ opacity: 0, x: imagePosition === "left" ? 50 : -50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className={cn(contentWidths[contentWidth])}
    >
      {/* Badges */}
      {badges && badges.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {badges.map((badge) => (
            <span
              key={badge}
              className="px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary"
            >
              {badge}
            </span>
          ))}
        </div>
      )}

      {/* Subtitle */}
      {subtitle && (
        <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
          {subtitle}
        </p>
      )}

      {/* Title */}
      {title && (
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          {title}
        </h2>
      )}

      {/* Content */}
      {content && (
        <p className="text-lg text-muted-foreground leading-relaxed mb-6">
          {content}
        </p>
      )}

      {/* Buttons */}
      {(ctaButton || secondaryButton) && (
        <div className="flex flex-wrap gap-3">
          {ctaButton && (
            <Button size="lg" asChild>
              <Link href={ctaButton.link}>
                {ctaButton.text}
                <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
          )}
          {secondaryButton && (
            <Button size="lg" variant="outline" asChild>
              <Link href={secondaryButton.link}>{secondaryButton.text}</Link>
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <div
          className={cn(
            "grid lg:grid-cols-2 gap-12 lg:gap-20",
            alignments[verticalAlign]
          )}
        >
          {imagePosition === "left" ? (
            <>
              {ImageSection}
              {ContentSection}
            </>
          ) : (
            <>
              {ContentSection}
              {ImageSection}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
