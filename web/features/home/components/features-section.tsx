"use client";

import { m } from "@/lib/animations";
import { CheckCircle2, ShieldCheck, Truck, Zap } from "lucide-react";

interface FeatureItem {
  title: string;
  description: string;
}

interface FeaturesSectionProps {
  title: string;
  subtitle?: string;
  items: FeatureItem[];
  styles?: {
    backgroundColor?: string;
    textColor?: string;
  };
}

/**
 * =================================================================================================
 * FEATURES SECTION - KHỐI TÍNH NĂNG NỔI BẬT
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DYNAMIC ICON MAPPING:
 *    - Dữ liệu từ DB chỉ lưu text ("Free Shipping"), không lưu component Icon.
 *    - Hàm `getIcon` có nhiệm vụ "phiên dịch" từ text sang Icon component tương ứng (Lucide React).
 *
 * 2. UI/UX DESIGN:
 *    - Sử dụng `backdrop-blur` và `border` mỏng để tạo cảm giác hiện đại (Glassmorphism).
 *    - Hover effect: Thay đổi màu background và shadow để tăng tính tương tác. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =================================================================================================
 */
export function FeaturesSection({
  title,
  subtitle,
  items,
  styles,
}: FeaturesSectionProps) {
  // Map titles to icons roughly or just use default
  const getIcon = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes("shipping")) return Truck;
    if (lower.includes("secure")) return ShieldCheck;
    if (lower.includes("fast")) return Zap;
    return CheckCircle2;
  };

  return (
    <section
      className="py-24 px-4 bg-background relative z-10 w-full overflow-hidden"
      style={{
        backgroundColor: styles?.backgroundColor,
        color: styles?.textColor,
      }}
    >
      {/* Background Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-accent/5 blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-1/3 h-full bg-secondary/10 blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          <span className="text-[10px] uppercase tracking-[0.2em] text-accent font-medium">
            {subtitle || "Why Choose Us"}
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-medium tracking-tight text-foreground">
            {title}
          </h2>
        </m.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, index) => {
            const Icon = getIcon(item.title);
            return (
              <m.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="group p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-accent/30 transition-all duration-300 hover:shadow-xl hover:shadow-accent/5"
              >
                <div className="mb-6 inline-flex p-4 rounded-xl bg-secondary group-hover:bg-accent/10 text-foreground group-hover:text-accent transition-colors duration-300">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-3 font-serif">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed font-light">
                    {item.description}
                  </p>
                </div>
              </m.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
