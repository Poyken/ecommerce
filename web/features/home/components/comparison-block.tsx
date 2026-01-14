"use client";

/**
 * =====================================================================
 * COMPARISON TABLE BLOCK - So sánh sản phẩm/gói dịch vụ
 * =====================================================================
 */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, Minus, X } from "lucide-react";
import type {
  BaseBlockProps,
  ComparisonColumn,
  ComparisonRow,
} from "../types/block-types";

interface ComparisonBlockProps extends BaseBlockProps {
  title?: string;
  subtitle?: string;
  columns?: ComparisonColumn[];
  rows?: ComparisonRow[];
  highlightColumn?: string;
  stickyHeader?: boolean;
  showCTA?: boolean;
  ctaText?: string;
}

const defaultColumns: ComparisonColumn[] = [
  {
    id: "basic",
    title: "Basic",
    subtitle: "Cho cửa hàng nhỏ",
    price: "499.000đ/tháng",
    isHighlighted: false,
  },
  {
    id: "pro",
    title: "Pro",
    subtitle: "Phổ biến nhất",
    price: "1.499.000đ/tháng",
    isHighlighted: true,
  },
  {
    id: "enterprise",
    title: "Enterprise",
    subtitle: "Cho doanh nghiệp lớn",
    price: "Liên hệ",
    isHighlighted: false,
  },
];

const defaultRows: ComparisonRow[] = [
  {
    feature: "Số lượng sản phẩm",
    values: { basic: "100", pro: "1,000", enterprise: "Không giới hạn" },
  },
  {
    feature: "Số lượng kho",
    values: { basic: "1", pro: "5", enterprise: "Không giới hạn" },
  },
  {
    feature: "Nhân viên",
    values: { basic: "2", pro: "10", enterprise: "Không giới hạn" },
  },
  {
    feature: "Custom Domain",
    values: { basic: false, pro: true, enterprise: true },
  },
  {
    feature: "AI Chatbot",
    values: { basic: false, pro: true, enterprise: true },
  },
  {
    feature: "B2B Price Lists",
    values: { basic: false, pro: true, enterprise: true },
  },
  {
    feature: "Affiliate System",
    values: { basic: false, pro: false, enterprise: true },
  },
  {
    feature: "API Access",
    values: { basic: false, pro: "Limited", enterprise: "Full" },
  },
  {
    feature: "Priority Support",
    values: { basic: false, pro: true, enterprise: true },
  },
  {
    feature: "Dedicated Account Manager",
    values: { basic: false, pro: false, enterprise: true },
  },
];

const renderValue = (value: boolean | string) => {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="size-5 text-emerald-500 mx-auto" />
    ) : (
      <X className="size-5 text-muted-foreground/50 mx-auto" />
    );
  }
  if (value === "-" || value === "") {
    return <Minus className="size-5 text-muted-foreground/50 mx-auto" />;
  }
  return <span className="font-medium">{value}</span>;
};

export function ComparisonBlock({
  title = "So sánh các gói dịch vụ",
  subtitle = "Chọn gói phù hợp với nhu cầu kinh doanh của bạn",
  columns = defaultColumns,
  rows = defaultRows,
  highlightColumn,
  stickyHeader = true,
  showCTA = true,
  ctaText = "Chọn gói này",
}: ComparisonBlockProps) {
  const highlightedId =
    highlightColumn || columns.find((c) => c.isHighlighted)?.id;

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

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="overflow-x-auto"
        >
          <table className="w-full min-w-[800px] border-collapse">
            {/* Header */}
            <thead className={cn(stickyHeader && "sticky top-0 z-10")}>
              <tr>
                <th className="py-6 px-4 text-left bg-background">
                  <span className="text-lg font-semibold">Tính năng</span>
                </th>
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className={cn(
                      "py-6 px-4 text-center min-w-[180px]",
                      col.id === highlightedId
                        ? "bg-primary text-primary-foreground rounded-t-2xl"
                        : "bg-secondary"
                    )}
                  >
                    <div className="space-y-1">
                      {col.id === highlightedId && (
                        <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                          Phổ biến nhất
                        </span>
                      )}
                      <div className="text-xl font-bold">{col.title}</div>
                      {col.subtitle && (
                        <div
                          className={cn(
                            "text-sm",
                            col.id === highlightedId
                              ? "text-primary-foreground/80"
                              : "text-muted-foreground"
                          )}
                        >
                          {col.subtitle}
                        </div>
                      )}
                      {col.price && (
                        <div className="text-lg font-bold mt-2">
                          {col.price}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row.feature}
                  className={cn(
                    "border-b border-border",
                    index % 2 === 0 ? "bg-background" : "bg-muted/30"
                  )}
                >
                  <td className="py-4 px-4 text-sm">{row.feature}</td>
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={cn(
                        "py-4 px-4 text-center text-sm",
                        col.id === highlightedId && "bg-primary/5"
                      )}
                    >
                      {renderValue(row.values[col.id])}
                    </td>
                  ))}
                </tr>
              ))}

              {/* CTA Row */}
              {showCTA && (
                <tr>
                  <td className="py-6 px-4"></td>
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={cn(
                        "py-6 px-4 text-center",
                        col.id === highlightedId && "bg-primary/5 rounded-b-2xl"
                      )}
                    >
                      <Button
                        variant={
                          col.id === highlightedId ? "default" : "outline"
                        }
                        className={cn(
                          col.id === highlightedId &&
                            "bg-primary hover:bg-primary/90"
                        )}
                      >
                        {ctaText}
                      </Button>
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}
