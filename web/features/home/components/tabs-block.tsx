"use client";

/**
 * =====================================================================
 * TABS BLOCK - Nội dung dạng tabs
 * =====================================================================
 */

import { cn } from "@/lib/utils";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion, AnimatePresence } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { useState } from "react";
import type { BaseBlockProps, IconName } from "../types/block-types";

interface TabItem {
  id: string;
  label: string;
  icon?: IconName;
  content: React.ReactNode;
}

interface TabsBlockProps extends BaseBlockProps {
  title?: string;
  subtitle?: string;
  tabs?: TabItem[];
  defaultTab?: string;
  variant?: "underline" | "pills" | "bordered";
  alignment?: "left" | "center" | "right";
  fullWidth?: boolean;
}

const defaultTabs: TabItem[] = [
  {
    id: "features",
    label: "Tính năng",
    icon: "Sparkles",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h3>Tính năng nổi bật</h3>
        <p>
          Platform cung cấp đầy đủ các công cụ để bạn xây dựng và vận hành cửa
          hàng online chuyên nghiệp.
        </p>
        <ul>
          <li>Multi-tenant architecture</li>
          <li>AI-powered chatbot</li>
          <li>B2B Price Lists</li>
          <li>Multi-warehouse management</li>
        </ul>
      </div>
    ),
  },
  {
    id: "pricing",
    label: "Bảng giá",
    icon: "CreditCard",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h3>Bảng giá linh hoạt</h3>
        <p>
          Chúng tôi cung cấp nhiều gói dịch vụ phù hợp với mọi quy mô kinh
          doanh.
        </p>
        <ul>
          <li>Basic: 499.000đ/tháng</li>
          <li>Pro: 1.499.000đ/tháng</li>
          <li>Enterprise: Liên hệ</li>
        </ul>
      </div>
    ),
  },
  {
    id: "support",
    label: "Hỗ trợ",
    icon: "Headphones",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h3>Hỗ trợ 24/7</h3>
        <p>Đội ngũ support chuyên nghiệp luôn sẵn sàng hỗ trợ bạn.</p>
        <ul>
          <li>Live Chat</li>
          <li>Email Support</li>
          <li>Phone Support (Enterprise)</li>
          <li>Knowledge Base</li>
        </ul>
      </div>
    ),
  },
];

export function TabsBlock({
  title,
  subtitle,
  tabs = defaultTabs,
  defaultTab,
  variant = "underline",
  alignment = "center",
  fullWidth = false,
}: TabsBlockProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const getIcon = (iconName?: string) => {
    if (!iconName) return null;
    const Icon = (LucideIcons as Record<string, LucideIcons.LucideIcon>)[
      iconName
    ];
    return Icon ? <Icon className="size-4" /> : null;
  };

  const alignmentClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  };

  const tabListVariants = {
    underline: "border-b border-border",
    pills: "bg-muted p-1 rounded-xl",
    bordered: "border border-border rounded-xl p-1",
  };

  const tabTriggerVariants = {
    underline: cn(
      "relative px-4 py-3 font-medium text-muted-foreground transition-colors",
      "hover:text-foreground",
      "data-[state=active]:text-foreground",
      "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5",
      "after:bg-primary after:scale-x-0 after:transition-transform",
      "data-[state=active]:after:scale-x-100"
    ),
    pills: cn(
      "px-4 py-2 rounded-lg font-medium text-muted-foreground transition-all",
      "hover:text-foreground hover:bg-background/50",
      "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
    ),
    bordered: cn(
      "px-4 py-2 rounded-lg font-medium text-muted-foreground transition-all",
      "hover:text-foreground",
      "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
    ),
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
        )}

        {/* Tabs */}
        <TabsPrimitive.Root value={activeTab} onValueChange={setActiveTab}>
          {/* Tab List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={cn("flex mb-8", alignmentClasses[alignment])}
          >
            <TabsPrimitive.List
              className={cn(
                "flex gap-1",
                tabListVariants[variant],
                fullWidth && "w-full"
              )}
            >
              {tabs.map((tab) => (
                <TabsPrimitive.Trigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    "flex items-center gap-2",
                    tabTriggerVariants[variant],
                    fullWidth && "flex-1 justify-center"
                  )}
                >
                  {getIcon(tab.icon)}
                  <span>{tab.label}</span>
                </TabsPrimitive.Trigger>
              ))}
            </TabsPrimitive.List>
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {tabs.map((tab) => (
              <TabsPrimitive.Content
                key={tab.id}
                value={tab.id}
                className="outline-none"
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 rounded-2xl bg-card border border-border"
                >
                  {tab.content}
                </motion.div>
              </TabsPrimitive.Content>
            ))}
          </AnimatePresence>
        </TabsPrimitive.Root>
      </div>
    </section>
  );
}
