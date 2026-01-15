"use client";

/**
 * =====================================================================
 * ACCORDION BLOCK - Nội dung dạng accordion (mở rộng từ FAQ)
 * =====================================================================
 */

import { cn } from "@/lib/utils";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { ChevronDown, Plus, Minus } from "lucide-react";
import type { BaseBlockProps, IconName } from "../types/block-types";
import { DynamicIcon } from "@/components/shared/dynamic-icon";
// Import dynamicIconImports just for type checking if needed, or cast string to type
import dynamicIconImports from "lucide-react/dist/esm/dynamicIconImports.js";

interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
  icon?: string; // Changed from IconName to string to match usage
  badge?: string;
}

interface AccordionBlockProps extends BaseBlockProps {
  title?: string;
  subtitle?: string;
  items?: AccordionItem[];
  allowMultipleOpen?: boolean;
  defaultOpenIndex?: number[];
  variant?: "default" | "bordered" | "separated";
  iconStyle?: "chevron" | "plus-minus";
  showIcons?: boolean;
}

const defaultItems: AccordionItem[] = [
  {
    id: "1",
    title: "Làm thế nào để bắt đầu?",
    content:
      "Để bắt đầu, bạn chỉ cần đăng ký tài khoản miễn phí, sau đó hoàn thành wizard onboarding để thiết lập cửa hàng. Quá trình chỉ mất khoảng 5 phút.",
    icon: "rocket", // Lowercase for dynamic imports
  },
  {
    id: "2",
    title: "Có hỗ trợ thanh toán online không?",
    content:
      "Có, chúng tôi tích hợp sẵn các cổng thanh toán phổ biến như VNPay, MoMo, ZaloPay, và Stripe cho thanh toán quốc tế.",
    icon: "credit-card",
  },
  {
    id: "3",
    title: "Tôi có thể dùng tên miền riêng không?",
    content:
      "Có, từ gói Pro trở lên bạn có thể kết nối tên miền riêng. Chúng tôi sẽ tự động cấp chứng chỉ SSL miễn phí cho domain của bạn.",
    icon: "globe",
    badge: "Pro",
  },
  {
    id: "4",
    title: "Chính sách hoàn tiền như thế nào?",
    content:
      "Chúng tôi có chính sách hoàn tiền 100% trong 14 ngày đầu tiên nếu bạn không hài lòng với dịch vụ. Không cần giải thích lý do.",
    icon: "refresh-ccw",
  },
  {
    id: "5",
    title: "Có giới hạn số lượng sản phẩm không?",
    content:
      "Mỗi gói có giới hạn sản phẩm khác nhau. Basic: 100 sản phẩm, Pro: 1,000 sản phẩm, Enterprise: Không giới hạn.",
    icon: "package",
  },
];

export function AccordionBlock({
  title = "Câu hỏi thường gặp",
  subtitle = "Những thắc mắc phổ biến về dịch vụ của chúng tôi",
  items = defaultItems,
  allowMultipleOpen = false,
  defaultOpenIndex = [],
  variant = "bordered",
  iconStyle = "chevron",
  showIcons = true,
}: AccordionBlockProps) {
  // Helper to safely get icon name
  const getIconName = (name: string): keyof typeof dynamicIconImports | null => {
    // Basic conversion from PascalCase to kebab-case if needed, but assuming input is correct or we fix data
    // For now, let's assume the input is correct kebab-case or commonly used names.
    // If usage passed "Rocket", we might need to convert to "rocket".
    const lowerName = name.toLowerCase().replace(/([a-z0-9])([A-Z])/g, '$1-$2'); 
    // This regex is a simple camelToKebab but let's just use lowercase for now as most lucide icons are simple.
    // Ideally we should enforce strict types.
    if (lowerName in dynamicIconImports) {
      return lowerName as keyof typeof dynamicIconImports;
    }
    return null;
  };

  const getIcon = (iconName?: string) => {
    if (!iconName) return null;
    const name = getIconName(iconName);
    if (!name) return null;
    return <DynamicIcon name={name} className="size-5" />;
  };

  const defaultValue = defaultOpenIndex
    .map((i) => items[i]?.id)
    .filter(Boolean) as string[];

  const variantClasses = {
    default: {
      root: "",
      item: "border-b border-border",
      trigger: "py-4",
      content: "pb-4",
    },
    bordered: {
      root: "border border-border rounded-2xl overflow-hidden",
      item: "border-b border-border last:border-b-0",
      trigger: "py-4 px-6",
      content: "px-6 pb-4",
    },
    separated: {
      root: "space-y-3",
      item: "border border-border rounded-xl overflow-hidden",
      trigger: "py-4 px-6",
      content: "px-6 pb-4",
    },
  };

  const classes = variantClasses[variant];

  // ... existing code
  const renderIcon = (isOpen: boolean) => {
    if (iconStyle === "plus-minus") {
      return isOpen ? (
        <Minus className="size-5 text-primary transition-transform" />
      ) : (
        <Plus className="size-5 text-muted-foreground transition-transform" />
      );
    }
    return (
      <ChevronDown
        className={cn(
          "size-5 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180 text-primary"
        )}
      />
    );
  };

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
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

        {/* Accordion */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="max-w-3xl mx-auto"
        >
          <AccordionPrimitive.Root
            type={allowMultipleOpen ? "multiple" : "single" as any}
            defaultValue={(allowMultipleOpen ? defaultValue : defaultValue[0]) as any}
            collapsible
            className={classes.root}
          >
            {items.map((item, index) => (
              <motion.div key={item.id} variants={fadeInUp}>
                <AccordionPrimitive.Item
                  value={item.id}
                  className={cn(classes.item, "group")}
                >
                  <AccordionPrimitive.Header>
                    <AccordionPrimitive.Trigger
                      className={cn(
                        "flex w-full items-center justify-between text-left",
                        "font-medium hover:text-primary transition-colors",
                        classes.trigger
                      )}
                    >
                      <div className="flex items-center gap-3 pr-4">
                        {showIcons && item.icon && (
                          <div className="flex-shrink-0 size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            {getIcon(item.icon)}
                          </div>
                        )}
                        <span className="text-base lg:text-lg">{item.title}</span>
                        {item.badge && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div className="flex-shrink-0">{renderIcon(false)}</div>
                    </AccordionPrimitive.Trigger>
                  </AccordionPrimitive.Header>
                  <AccordionPrimitive.Content
                    className={cn(
                      "overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up",
                      classes.content
                    )}
                  >
                    <div
                      className={cn(
                        "text-muted-foreground",
                        showIcons && "pl-13"
                      )}
                    >
                      {typeof item.content === "string" ? (
                        <p>{item.content}</p>
                      ) : (
                        item.content
                      )}
                    </div>
                  </AccordionPrimitive.Content>
                </AccordionPrimitive.Item>
              </motion.div>
            ))}
          </AccordionPrimitive.Root>
        </motion.div>
      </div>
    </section>
  );
}

