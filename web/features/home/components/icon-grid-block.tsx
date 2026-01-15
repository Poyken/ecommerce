"use client";

/**
 * =====================================================================
 * ICON GRID BLOCK - Grid các feature icons với mô tả ngắn
 * =====================================================================
 */

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { BaseBlockProps, IconGridItem } from "../types/block-types";
import { DynamicIcon } from "@/components/shared/dynamic-icon";
import dynamicIconImports from "lucide-react/dist/esm/dynamicIconImports.js";

interface IconGridBlockProps extends BaseBlockProps {
  title?: string;
  subtitle?: string;
  items?: IconGridItem[];
  columns?: 2 | 3 | 4 | 5 | 6;
  iconSize?: "sm" | "md" | "lg";
  iconStyle?: "circle" | "square" | "rounded" | "none";
  iconColor?: string;
  alignment?: "left" | "center";
  cardStyle?: "none" | "bordered" | "elevated" | "glass";
  showDescriptions?: boolean;
}

const defaultItems: IconGridItem[] = [
  {
    icon: "zap",
    title: "Tốc độ cao",
    description: "Tối ưu hiệu suất với CDN toàn cầu",
  },
  {
    icon: "shield",
    title: "Bảo mật",
    description: "SSL miễn phí và bảo vệ DDoS",
  },
  {
    icon: "globe",
    title: "Đa ngôn ngữ",
    description: "Hỗ trợ nhiều ngôn ngữ và tiền tệ",
  },
  {
    icon: "smartphone",
    title: "Mobile-first",
    description: "Giao diện tối ưu cho mọi thiết bị",
  },
  {
    icon: "line-chart",
    title: "Analytics",
    description: "Báo cáo doanh thu chi tiết",
  },
  {
    icon: "headphones",
    title: "Hỗ trợ 24/7",
    description: "Đội ngũ support luôn sẵn sàng",
  },
];

export function IconGridBlock({
  title = "Tại sao chọn chúng tôi?",
  subtitle = "Những lợi ích khi sử dụng platform của chúng tôi",
  items = defaultItems,
  columns = 3,
  iconSize = "md",
  iconStyle = "circle",
  iconColor,
  alignment = "center",
  cardStyle = "none",
  showDescriptions = true,
}: IconGridBlockProps) {
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
    5: "md:grid-cols-3 lg:grid-cols-5",
    6: "md:grid-cols-3 lg:grid-cols-6",
  };

  const iconSizes = {
    sm: "size-8",
    md: "size-12",
    lg: "size-16",
  };

  const iconInnerSizes = {
    sm: "size-4",
    md: "size-6",
    lg: "size-8",
  };

  const iconStyles = {
    circle: "rounded-full",
    square: "rounded-none",
    rounded: "rounded-xl",
    none: "",
  };

  const cardStyles = {
    none: "",
    bordered: "bg-card border border-border p-6",
    elevated: "bg-card shadow-lg p-6 hover:shadow-xl transition-shadow",
    glass: "glass p-6",
  };

  const alignments = {
    left: "text-left items-start",
    center: "text-center items-center",
  };

  const getIcon = (iconName: string) => {
    const name = iconName.toLowerCase().replace(/([a-z0-9])([A-Z])/g, '$1-$2');
    if (name in dynamicIconImports) {
      return <DynamicIcon name={name as keyof typeof dynamicIconImports} className={iconInnerSizes[iconSize]} />;
    }
    return null;
  };

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        {(title || subtitle) && (
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
        )}

        {/* Grid */}
        <div className={cn("grid gap-6 lg:gap-8", gridCols[columns])}>
          {items.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex flex-col rounded-2xl",
                alignments[alignment],
                cardStyles[cardStyle]
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "flex items-center justify-center mb-4",
                  iconSizes[iconSize],
                  iconStyles[iconStyle],
                  iconStyle !== "none" && "bg-primary/10 text-primary"
                )}
                style={iconColor ? { color: iconColor } : undefined}
              >
                {getIcon(item.icon)}
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold mb-1">{item.title}</h3>

              {/* Description */}
              {showDescriptions && item.description && (
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              )}

              {/* Link */}
              {item.link && (
                <a
                  href={item.link}
                  className="mt-2 text-sm font-medium text-primary hover:underline"
                >
                  Tìm hiểu thêm →
                </a>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
