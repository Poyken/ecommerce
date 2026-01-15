"use client";

/**
 * =====================================================================
 * STEPS BLOCK - Hiển thị quy trình dạng số bước
 * =====================================================================
 */

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import Image from "next/image";
import type { BaseBlockProps, StepItem } from "../types/block-types";

interface StepsBlockProps extends BaseBlockProps {
  title?: string;
  subtitle?: string;
  items?: StepItem[];
  layout?: "horizontal" | "vertical" | "alternating";
  connectorStyle?: "line" | "arrow" | "dotted" | "none";
  showNumbers?: boolean;
  showIcons?: boolean;
  numberStyle?: "circle" | "square" | "badge";
}

const defaultItems: StepItem[] = [
  {
    number: 1,
    title: "Đăng ký tài khoản",
    description:
      "Tạo tài khoản miễn phí chỉ với email và mật khẩu. Không cần thẻ tín dụng.",
    icon: "UserPlus",
  },
  {
    number: 2,
    title: "Thiết lập cửa hàng",
    description:
      "Hoàn thành wizard onboarding để cấu hình thông tin cơ bản, logo và theme.",
    icon: "Settings",
  },
  {
    number: 3,
    title: "Thêm sản phẩm",
    description:
      "Upload sản phẩm thủ công hoặc import hàng loạt từ file Excel/CSV.",
    icon: "Package",
  },
  {
    number: 4,
    title: "Bắt đầu bán hàng",
    description: "Chia sẻ link cửa hàng và bắt đầu nhận đơn hàng đầu tiên.",
    icon: "Rocket",
  },
];

export function StepsBlock({
  title = "Bắt đầu chỉ với 4 bước",
  subtitle = "Quy trình đơn giản để khởi tạo cửa hàng của bạn",
  items = defaultItems,
  layout = "horizontal",
  connectorStyle = "line",
  showNumbers = true,
  showIcons = true,
  numberStyle = "circle",
}: StepsBlockProps) {
  const getIcon = (iconName?: string) => {
    if (!iconName) return null;
    const Icon = (LucideIcons as Record<string, LucideIcons.LucideIcon>)[
      iconName
    ];
    return Icon ? <Icon className="size-6" /> : null;
  };

  const numberStyles = {
    circle: "rounded-full",
    square: "rounded-lg",
    badge: "rounded-full",
  };

  const connectorStyles = {
    line: "border-t-2 border-border",
    arrow: "border-t-2 border-border",
    dotted: "border-t-2 border-dashed border-border",
    none: "hidden",
  };

  // Horizontal Layout
  if (layout === "horizontal") {
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

          {/* Steps */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative text-center"
              >
                {/* Connector Line */}
                {index < items.length - 1 && connectorStyle !== "none" && (
                  <div
                    className={cn(
                      "hidden lg:block absolute top-8 left-1/2 w-full",
                      connectorStyles[connectorStyle]
                    )}
                  />
                )}

                {/* Number/Icon */}
                <div className="relative z-10 flex justify-center mb-4">
                  <div
                    className={cn(
                      "size-16 flex items-center justify-center bg-primary text-primary-foreground",
                      numberStyles[numberStyle]
                    )}
                  >
                    {showNumbers && !showIcons && (
                      <span className="text-2xl font-bold">
                        {item.number || index + 1}
                      </span>
                    )}
                    {showIcons && getIcon(item.icon)}
                    {showNumbers && showIcons && (
                      <span className="absolute -bottom-1 -right-1 size-6 flex items-center justify-center bg-card border-2 border-primary rounded-full text-xs font-bold text-primary">
                        {item.number || index + 1}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Vertical Layout
  if (layout === "vertical") {
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

          {/* Steps */}
          <div className="max-w-2xl mx-auto">
            {items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative flex gap-6 pb-12 last:pb-0"
              >
                {/* Connector Line */}
                {index < items.length - 1 && connectorStyle !== "none" && (
                  <div
                    className={cn(
                      "absolute left-8 top-16 bottom-0 w-0.5 bg-border",
                      connectorStyle === "dotted" &&
                        "border-l-2 border-dashed border-border bg-transparent"
                    )}
                  />
                )}

                {/* Number/Icon */}
                <div className="relative z-10 flex-shrink-0">
                  <div
                    className={cn(
                      "size-16 flex items-center justify-center bg-primary text-primary-foreground",
                      numberStyles[numberStyle]
                    )}
                  >
                    {showNumbers && !showIcons && (
                      <span className="text-2xl font-bold">
                        {item.number || index + 1}
                      </span>
                    )}
                    {showIcons && getIcon(item.icon)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pt-3">
                  {showNumbers && showIcons && (
                    <span className="text-sm font-medium text-primary">
                      Bước {item.number || index + 1}
                    </span>
                  )}
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Alternating Layout
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

        {/* Steps */}
        <div className="max-w-4xl mx-auto">
          {items.map((item, index) => {
            const isEven = index % 2 === 0;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "relative flex items-center gap-8 pb-16 last:pb-0",
                  isEven ? "flex-row" : "flex-row-reverse"
                )}
              >
                {/* Connector Line (Center) */}
                {index < items.length - 1 && connectorStyle !== "none" && (
                  <div className="absolute left-1/2 top-16 bottom-0 w-0.5 bg-border -translate-x-1/2" />
                )}

                {/* Content */}
                <div
                  className={cn(
                    "flex-1",
                    isEven ? "text-right pr-8" : "text-left pl-8"
                  )}
                >
                  <span className="text-sm font-medium text-primary">
                    Bước {item.number || index + 1}
                  </span>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>

                {/* Number/Icon (Center) */}
                <div className="relative z-10 flex-shrink-0">
                  <div
                    className={cn(
                      "size-16 flex items-center justify-center bg-primary text-primary-foreground",
                      numberStyles[numberStyle]
                    )}
                  >
                    {showIcons ? (
                      getIcon(item.icon)
                    ) : (
                      <span className="text-2xl font-bold">
                        {item.number || index + 1}
                      </span>
                    )}
                  </div>
                </div>

                {/* Spacer for alternating */}
                <div className="flex-1" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
