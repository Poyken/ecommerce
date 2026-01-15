"use client";

/**
 * =====================================================================
 * TIMELINE BLOCK - Lịch sử, Milestones, Roadmap
 * =====================================================================
 */

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { BaseBlockProps, TimelineItem } from "../types/block-types";
import { DynamicIcon } from "@/components/shared/dynamic-icon";
import dynamicIconImports from "lucide-react/dist/esm/dynamicIconImports.js";

interface TimelineBlockProps extends BaseBlockProps {
  title?: string;
  subtitle?: string;
  items?: TimelineItem[];
  orientation?: "vertical" | "horizontal";
  lineStyle?: "solid" | "dashed" | "dotted";
  showIcons?: boolean;
  alternating?: boolean;
}

const defaultItems: TimelineItem[] = [
  {
    date: "2020",
    title: "Khởi đầu",
    description: "Ra mắt phiên bản đầu tiên với các tính năng cơ bản",
    icon: "rocket",
  },
  {
    date: "2021",
    title: "Mở rộng",
    description: "Đạt 1,000 cửa hàng đăng ký và ra mắt gói PRO",
    icon: "trending-up",
  },
  {
    date: "2022",
    title: "Tích hợp AI",
    description: "Ra mắt AI Chatbot và Auto-tagging với Gemini",
    icon: "bot",
  },
  {
    date: "2023",
    title: "B2B Launch",
    description: "Hỗ trợ bán buôn với Price Lists và Customer Groups",
    icon: "users",
  },
  {
    date: "2024",
    title: "Toàn cầu hóa",
    description: "Mở rộng ra thị trường Đông Nam Á",
    icon: "globe",
  },
];

export function TimelineBlock({
  title = "Hành trình phát triển",
  subtitle = "Những cột mốc quan trọng trong lịch sử phát triển",
  items = defaultItems,
  orientation = "vertical",
  lineStyle = "solid",
  showIcons = true,
  alternating = true,
}: TimelineBlockProps) {
  const lineStyles = {
    solid: "border-solid",
    dashed: "border-dashed",
    dotted: "border-dotted",
  };

  const getIcon = (iconName?: string) => {
    if (!iconName) return null;
    const name = iconName.toLowerCase().replace(/([a-z0-9])([A-Z])/g, '$1-$2');
    if (name in dynamicIconImports) {
      return <DynamicIcon name={name as keyof typeof dynamicIconImports} className="size-5" />;
    }
    return null;
  };

  if (orientation === "horizontal") {
    return (
      <section className="py-16 lg:py-24 overflow-hidden">
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

          {/* Horizontal Timeline */}
          <div className="relative">
            {/* Line */}
            <div
              className={cn(
                "absolute top-8 left-0 right-0 h-0.5 bg-border",
                lineStyles[lineStyle]
              )}
            />

            {/* Items */}
            <div className="flex gap-8 overflow-x-auto pb-8 no-scrollbar">
              {items.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex-shrink-0 w-64"
                >
                  {/* Dot */}
                  <div className="relative flex justify-center mb-6">
                    <div
                      className={cn(
                        "size-16 rounded-full flex items-center justify-center z-10",
                        showIcons
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border-4 border-primary"
                      )}
                    >
                      {showIcons && getIcon(item.icon)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="text-center">
                    <span className="text-sm font-bold text-primary">
                      {item.date}
                    </span>
                    <h3 className="text-lg font-semibold mt-1 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Vertical Timeline
  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
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

        {/* Vertical Timeline */}
        <div className="relative max-w-4xl mx-auto">
          {/* Center Line */}
          <div
            className={cn(
              "absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-border",
              lineStyles[lineStyle]
            )}
          />

          {/* Items */}
          <div className="space-y-12">
            {items.map((item, index) => {
              const isEven = index % 2 === 0;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: alternating && isEven ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "relative flex items-center gap-8",
                    alternating && "md:justify-center"
                  )}
                >
                  {/* Dot */}
                  <div
                    className={cn(
                      "absolute left-4 md:left-1/2 -translate-x-1/2 size-12 rounded-full flex items-center justify-center z-10",
                      showIcons
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border-4 border-primary"
                    )}
                  >
                    {showIcons && getIcon(item.icon)}
                  </div>

                  {/* Content */}
                  <div
                    className={cn(
                      "ml-20 md:ml-0 md:w-5/12 p-6 rounded-2xl bg-card border border-border shadow-sm",
                      alternating && isEven
                        ? "md:mr-auto md:text-right"
                        : "md:ml-auto"
                    )}
                  >
                    <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-primary/10 text-primary mb-2">
                      {item.date}
                    </span>
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
