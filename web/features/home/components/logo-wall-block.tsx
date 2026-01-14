"use client";

/**
 * =====================================================================
 * LOGO WALL BLOCK - Grid/Carousel logo khách hàng đối tác
 * =====================================================================
 */

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";
import type { BaseBlockProps, LogoItem } from "../types/block-types";

interface LogoWallBlockProps extends BaseBlockProps {
  title?: string;
  subtitle?: string;
  logos?: LogoItem[];
  layout?: "grid" | "carousel" | "marquee";
  columns?: 3 | 4 | 5 | 6;
  grayscale?: boolean;
  hoverEffect?: "none" | "lift" | "scale" | "glow";
  logoSize?: "sm" | "md" | "lg";
  showNames?: boolean;
}

const defaultLogos: LogoItem[] = [
  { name: "Google", imageUrl: "/images/logos/google.svg", link: "#" },
  { name: "Microsoft", imageUrl: "/images/logos/microsoft.svg", link: "#" },
  { name: "Amazon", imageUrl: "/images/logos/amazon.svg", link: "#" },
  { name: "Meta", imageUrl: "/images/logos/meta.svg", link: "#" },
  { name: "Apple", imageUrl: "/images/logos/apple.svg", link: "#" },
  { name: "Netflix", imageUrl: "/images/logos/netflix.svg", link: "#" },
  { name: "Spotify", imageUrl: "/images/logos/spotify.svg", link: "#" },
  { name: "Slack", imageUrl: "/images/logos/slack.svg", link: "#" },
];

export function LogoWallBlock({
  title = "Được tin tưởng bởi",
  subtitle = "Hơn 10,000 doanh nghiệp đã tin tưởng sử dụng platform của chúng tôi",
  logos = defaultLogos,
  layout = "grid",
  columns = 4,
  grayscale = true,
  hoverEffect = "lift",
  logoSize = "md",
  showNames = false,
}: LogoWallBlockProps) {
  const gridCols = {
    3: "grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
    5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
    6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
  };

  const sizes = {
    sm: "h-8",
    md: "h-12",
    lg: "h-16",
  };

  const hoverEffects = {
    none: "",
    lift: "hover:-translate-y-1",
    scale: "hover:scale-110",
    glow: "hover:shadow-lg hover:shadow-primary/20",
  };

  const LogoCard = ({ logo, index }: { logo: LogoItem; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "flex flex-col items-center justify-center p-6 rounded-xl transition-all duration-300",
        "bg-card/50 hover:bg-card border border-transparent hover:border-border",
        hoverEffects[hoverEffect]
      )}
    >
      {logo.link ? (
        <a
          href={logo.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center"
        >
          <div
            className={cn(
              "relative w-full flex items-center justify-center",
              sizes[logoSize],
              grayscale && "grayscale hover:grayscale-0 transition-all"
            )}
          >
            <Image
              src={logo.imageUrl}
              alt={logo.name}
              width={120}
              height={48}
              className="object-contain max-h-full"
            />
          </div>
          {showNames && (
            <span className="mt-2 text-sm text-muted-foreground">
              {logo.name}
            </span>
          )}
        </a>
      ) : (
        <>
          <div
            className={cn(
              "relative w-full flex items-center justify-center",
              sizes[logoSize],
              grayscale && "grayscale hover:grayscale-0 transition-all"
            )}
          >
            <Image
              src={logo.imageUrl}
              alt={logo.name}
              width={120}
              height={48}
              className="object-contain max-h-full"
            />
          </div>
          {showNames && (
            <span className="mt-2 text-sm text-muted-foreground">
              {logo.name}
            </span>
          )}
        </>
      )}
    </motion.div>
  );

  // Marquee layout
  if (layout === "marquee") {
    return (
      <section className="py-16 lg:py-24 overflow-hidden">
        <div className="container mx-auto px-4 lg:px-8 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
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
        </div>

        {/* Marquee */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />

          <motion.div
            animate={{ x: [0, -50 * logos.length] }}
            transition={{
              repeat: Infinity,
              duration: logos.length * 3,
              ease: "linear",
            }}
            className="flex gap-8"
          >
            {[...logos, ...logos].map((logo, index) => (
              <div
                key={`${logo.name}-${index}`}
                className={cn(
                  "flex-shrink-0 flex items-center justify-center p-4 rounded-xl bg-card/50",
                  "min-w-[150px]",
                  grayscale && "grayscale hover:grayscale-0 transition-all"
                )}
              >
                <Image
                  src={logo.imageUrl}
                  alt={logo.name}
                  width={100}
                  height={40}
                  className={cn("object-contain", sizes[logoSize])}
                />
              </div>
            ))}
          </motion.div>
        </div>
      </section>
    );
  }

  // Grid layout
  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-12"
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

        {/* Logo Grid */}
        <div className={cn("grid gap-4 lg:gap-6", gridCols[columns])}>
          {logos.map((logo, index) => (
            <LogoCard key={logo.name} logo={logo} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
