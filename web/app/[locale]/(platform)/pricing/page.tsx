"use client";

/**
 * =====================================================================
 * PRICING PAGE - Bảng giá chi tiết các gói dịch vụ
 * =====================================================================
 */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { m, Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Check,
  HelpCircle,
  Minus,
  Plus,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import * as React from "react";
import { useState } from "react";

// Animation variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer: Variants = {
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Pricing Plans Data
const pricingPlans = [
  {
    id: "basic",
    name: "Basic",
    description: "Hoàn hảo cho cửa hàng mới bắt đầu",
    priceMonthly: 499000,
    priceYearly: 4990000,
    currency: "VND",
    features: [
      { name: "100 sản phẩm", included: true },
      { name: "1 kho hàng", included: true },
      { name: "2 nhân viên", included: true },
      { name: "1GB lưu trữ", included: true },
      { name: "Subdomain miễn phí", included: true },
      { name: "Hỗ trợ email", included: true },
      { name: "Custom Domain", included: false },
      { name: "AI Chatbot", included: false },
      { name: "B2B Price Lists", included: false },
      { name: "Affiliate System", included: false },
      { name: "API Access", included: false },
      { name: "Priority Support", included: false },
    ],
    cta: "Bắt đầu miễn phí",
    ctaLink: "/register?plan=basic",
    isPopular: false,
  },
  {
    id: "pro",
    name: "Pro",
    description: "Cho cửa hàng đang phát triển nhanh",
    priceMonthly: 1499000,
    priceYearly: 14990000,
    currency: "VND",
    badge: "Phổ biến nhất",
    features: [
      { name: "1,000 sản phẩm", included: true },
      { name: "5 kho hàng", included: true },
      { name: "10 nhân viên", included: true },
      { name: "10GB lưu trữ", included: true },
      { name: "Custom Domain", included: true },
      { name: "AI Chatbot", included: true },
      { name: "B2B Price Lists", included: true },
      { name: "Multi-currency", included: true },
      { name: "Priority Support", included: true },
      { name: "Analytics Dashboard", included: true },
      { name: "Affiliate System", included: false },
      { name: "Full API Access", included: false },
    ],
    cta: "Dùng thử 14 ngày",
    ctaLink: "/register?plan=pro",
    isPopular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Giải pháp toàn diện cho doanh nghiệp",
    priceMonthly: null,
    priceYearly: null,
    currency: "VND",
    features: [
      { name: "Không giới hạn sản phẩm", included: true },
      { name: "Không giới hạn kho", included: true },
      { name: "Không giới hạn nhân viên", included: true },
      { name: "100GB+ lưu trữ", included: true },
      { name: "Custom Domain + SSL", included: true },
      { name: "AI Chatbot + Training", included: true },
      { name: "B2B Price Lists", included: true },
      { name: "Affiliate System", included: true },
      { name: "Full API Access", included: true },
      { name: "Dedicated Account Manager", included: true },
      { name: "SLA 99.9%", included: true },
      { name: "Custom Integration", included: true },
    ],
    cta: "Liên hệ tư vấn",
    ctaLink: "/contact?plan=enterprise",
    isPopular: false,
  },
];

// Comparison Table Data
const comparisonFeatures = [
  {
    category: "Sản phẩm & Kho hàng",
    features: [
      {
        name: "Số lượng sản phẩm",
        basic: "100",
        pro: "1,000",
        enterprise: "Không giới hạn",
      },
      {
        name: "Số lượng SKU/biến thể",
        basic: "500",
        pro: "5,000",
        enterprise: "Không giới hạn",
      },
      {
        name: "Số kho hàng",
        basic: "1",
        pro: "5",
        enterprise: "Không giới hạn",
      },
      { name: "Quản lý tồn kho", basic: true, pro: true, enterprise: true },
    ],
  },
  {
    category: "Đơn hàng & Thanh toán",
    features: [
      {
        name: "Đơn hàng/tháng",
        basic: "100",
        pro: "1,000",
        enterprise: "Không giới hạn",
      },
      { name: "Phí giao dịch", basic: "2%", pro: "1%", enterprise: "0%" },
      {
        name: "Partial Fulfillment",
        basic: false,
        pro: true,
        enterprise: true,
      },
      { name: "Multi-currency", basic: false, pro: true, enterprise: true },
    ],
  },
  {
    category: "Marketing & Bán hàng",
    features: [
      {
        name: "Mã giảm giá",
        basic: "5",
        pro: "50",
        enterprise: "Không giới hạn",
      },
      { name: "B2B Price Lists", basic: false, pro: true, enterprise: true },
      { name: "Affiliate System", basic: false, pro: false, enterprise: true },
      { name: "Loyalty Points", basic: false, pro: true, enterprise: true },
    ],
  },
  {
    category: "Công nghệ & API",
    features: [
      { name: "Custom Domain", basic: false, pro: true, enterprise: true },
      { name: "AI Chatbot", basic: false, pro: true, enterprise: true },
      { name: "API Access", basic: false, pro: "Limited", enterprise: "Full" },
      { name: "Webhooks", basic: false, pro: false, enterprise: true },
    ],
  },
  {
    category: "Hỗ trợ",
    features: [
      { name: "Email Support", basic: true, pro: true, enterprise: true },
      { name: "Live Chat", basic: false, pro: true, enterprise: true },
      { name: "Phone Support", basic: false, pro: false, enterprise: true },
      { name: "Dedicated Manager", basic: false, pro: false, enterprise: true },
    ],
  },
];

// FAQ Data
const faqs = [
  {
    question: "Tôi có thể đổi gói bất cứ lúc nào không?",
    answer:
      "Có, bạn có thể nâng cấp hoặc hạ cấp gói bất cứ lúc nào. Khi nâng cấp, bạn sẽ được tính theo tỷ lệ cho thời gian còn lại. Khi hạ cấp, thay đổi sẽ có hiệu lực từ chu kỳ thanh toán tiếp theo.",
  },
  {
    question: "Có trial miễn phí không?",
    answer:
      "Có, gói Basic hoàn toàn miễn phí để bắt đầu. Với gói Pro, bạn được dùng thử 14 ngày đầy đủ tính năng trước khi quyết định nâng cấp.",
  },
  {
    question: "Phương thức thanh toán nào được hỗ trợ?",
    answer:
      "Chúng tôi hỗ trợ thanh toán qua VNPay (thẻ ATM nội địa, Visa/Mastercard), MoMo, ZaloPay và chuyển khoản ngân hàng. Đối với Enterprise, hỗ trợ thêm thanh toán theo hợp đồng.",
  },
  {
    question: "Dữ liệu của tôi có an toàn không?",
    answer:
      "Tuyệt đối. Chúng tôi sử dụng mã hóa SSL/TLS, backup hàng ngày, và tuân thủ các tiêu chuẩn bảo mật quốc tế. Dữ liệu được lưu trữ trên AWS với SLA 99.9%.",
  },
  {
    question: "Làm thế nào để hủy subscription?",
    answer:
      "Bạn có thể hủy subscription bất cứ lúc nào từ trang Settings. Không có phí hủy sớm. Sau khi hủy, bạn vẫn giữ quyền truy cập đến hết chu kỳ đã thanh toán.",
  },
];

const formatPrice = (price: number | null, currency: string) => {
  if (price === null) return "Liên hệ";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
  }).format(price);
};

export default function PricingPage() {
  const t = useTranslations("common");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );

  return (
    <main className="min-h-screen bg-background relative overflow-hidden selection:bg-primary/30">
      {/* Cinematic Background & Aurora Glow */}
      <div className="absolute top-0 inset-x-0 h-[70vh] bg-cinematic pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-(--aurora-blue)/15 rounded-full blur-[150px] animate-pulse-glow pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-(--aurora-purple)/10 rounded-full blur-[120px] animate-float pointer-events-none" />
      <div className="absolute bottom-[10%] left-[20%] w-[30%] h-[30%] bg-(--aurora-orange)/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative py-32 lg:py-48 z-10">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <m.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <m.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-premium border border-white/10 text-accent text-[10px] font-black uppercase tracking-[0.3em] mb-8"
            >
              <Sparkles className="size-3" />
              <span>{t("subTitle") || "Bắt đầu miễn phí, nâng cấp khi cần"}</span>
            </m.div>

            <m.h1
              variants={fadeInUp}
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 bg-clip-text text-transparent bg-linear-to-b from-white to-white/40"
            >
              Chọn gói phù hợp với{" "}
              <span className="font-serif italic font-normal text-muted-foreground/60 block md:inline">
                doanh nghiệp của bạn
              </span>
            </m.h1>

            <m.p
              variants={fadeInUp}
              className="text-xl text-muted-foreground/80 mb-12 max-w-2xl mx-auto font-medium"
            >
              Linh hoạt nâng cấp theo nhu cầu. Không phí ẩn. Hủy bất cứ lúc nào.
            </m.p>

            {/* Billing Toggle */}
            <m.div
              variants={fadeInUp}
              className="inline-flex items-center gap-4 p-2 rounded-full glass-card border-none shadow-2xl"
            >
              <button
                onClick={() => setBillingCycle("monthly")}
                className={cn(
                  "px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all",
                  billingCycle === "monthly"
                    ? "bg-primary text-primary-foreground shadow-xl scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                Hàng tháng
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={cn(
                  "px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                  billingCycle === "yearly"
                    ? "bg-primary text-primary-foreground shadow-xl scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                Hàng năm
                <span className="px-2 py-0.5 text-[10px] rounded-md bg-emerald-500 text-white animate-pulse">
                  -17%
                </span>
              </button>
            </m.div>
          </m.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <m.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "relative rounded-4xl p-10 flex flex-col justify-between h-full transition-all duration-500 overflow-hidden",
                  plan.isPopular
                    ? "bg-white text-black scale-105 shadow-[0_0_80px_rgba(255,255,255,0.1)] z-20"
                    : "glass-card border-none hover:scale-[1.02] shadow-2xl z-10"
                )}
              >
                {/* Popular Glow */}
                {plan.isPopular && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-(--aurora-blue)/20 rounded-full blur-3xl -mr-16 -mt-16" />
                )}

                <div className="flex-1 space-y-8 relative z-10">
                  {/* Badge */}
                  {plan.badge && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 text-black text-[10px] font-black uppercase tracking-widest border border-black/10">
                      <Zap className="size-3 fill-black" />
                      {plan.badge}
                    </div>
                  )}

                  {/* Plan Name */}
                  <div>
                    <h3 className="text-4xl font-bold tracking-tighter mb-3">{plan.name}</h3>
                    <p className={cn("text-sm font-medium", plan.isPopular ? "text-black/60" : "text-muted-foreground")}>
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div>
                    <div className="flex items-baseline gap-2">
                       <span className="text-[10px] font-black uppercase tracking-widest text-accent self-start mt-2">VND</span>
                      <span className="text-5xl md:text-6xl font-black tracking-tighter">
                        {formatPrice(
                          billingCycle === "monthly"
                            ? plan.priceMonthly
                            : plan.priceYearly,
                          plan.currency
                        ).replace("₫", "").trim() || "0"}
                      </span>
                      {plan.priceMonthly !== null && (
                        <span className={cn("text-xs font-black uppercase tracking-[0.2em]", plan.isPopular ? "text-black/40" : "text-muted-foreground/40")}>
                          /{billingCycle === "monthly" ? "tháng" : "năm"}
                        </span>
                      )}
                    </div>
                    {billingCycle === "yearly" && plan.priceMonthly && (
                      <p className={cn("text-xs font-black uppercase tracking-widest mt-2 px-3 py-1 rounded-full inline-block", plan.isPopular ? "bg-black/5 text-black" : "bg-white/5 text-accent")}>
                        Tiết kiệm{" "}
                        {formatPrice(
                          plan.priceMonthly * 12 - (plan.priceYearly || 0),
                          plan.currency
                        )}
                      </p>
                    )}
                  </div>

                  {/* Features List */}
                  <div className="pt-8 border-t border-current/10 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Tính năng bao gồm:</p>
                    <ul className="space-y-4">
                      {plan.features.map((feature) => (
                        <li key={feature.name} className="flex items-start gap-4 group/item">
                          {feature.included ? (
                            <div className={cn("p-1 rounded-full shrink-0 group-hover/item:scale-110 transition-transform", plan.isPopular ? "bg-black text-white" : "bg-accent/20 text-accent")}>
                               <Check className="size-3 stroke-4" />
                            </div>
                          ) : (
                            <div className="p-1 rounded-full shrink-0 opacity-20">
                              <X className="size-3 stroke-4" />
                            </div>
                          )}
                          <span className={cn("text-sm font-medium transition-colors", 
                            !feature.included ? "opacity-30" : "opacity-100",
                            plan.isPopular ? "text-black" : "text-foreground"
                          )}>
                            {feature.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="mt-12 relative z-10">
                  <Button
                    size="lg"
                    className={cn(
                      "w-full h-16 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all duration-500 hover:scale-[1.02]",
                      plan.isPopular
                        ? "bg-black text-white hover:bg-black/90 shadow-black/20"
                        : "bg-white text-black hover:bg-white/90 shadow-white/10"
                    )}
                    asChild
                  >
                    <Link href={plan.ctaLink as "/register" | "/contact"}>
                      {plan.cta}
                      <ArrowRight className="size-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-32 relative z-10">
        <div className="container mx-auto px-4 lg:px-8">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-20 space-y-4"
          >
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-premium border border-white/10 text-accent text-[10px] font-black uppercase tracking-[0.3em] mb-4">
              <Plus className="size-3" />
              <span>Details</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter">
              So sánh <span className="font-serif italic text-muted-foreground/60">chi tiết</span>
            </h2>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overflow-x-auto no-scrollbar"
          >
            <div className="min-w-[1000px] glass-card border-none rounded-4xl p-8 shadow-2xl overflow-hidden relative">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-8 px-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Tính năng</th>
                    <th className="py-8 px-6 text-center text-xl font-bold tracking-tighter">Basic</th>
                    <th className="py-8 px-6 text-center bg-white/5 rounded-t-3xl">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] text-accent font-black uppercase tracking-widest">Phổ biến</span>
                        <span className="text-xl font-bold tracking-tighter">Pro</span>
                      </div>
                    </th>
                    <th className="py-8 px-6 text-center text-xl font-bold tracking-tighter">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((category) => (
                    <React.Fragment key={category.category}>
                      <tr>
                        <td colSpan={4} className="py-10 px-6">
                           <div className="flex items-center gap-4">
                              <span className="text-xs font-black uppercase tracking-[0.3em] text-accent">{category.category}</span>
                              <div className="h-px flex-1 bg-white/10" />
                           </div>
                        </td>
                      </tr>
                      {category.features.map((feature, idx) => (
                        <tr key={idx} className="group hover:bg-white/5 transition-colors">
                          <td className="py-5 px-6 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{feature.name}</td>
                          <td className="py-5 px-6 text-center font-bold">
                            {typeof feature.basic === "boolean" ? (
                              feature.basic ? (
                                <div className="p-1.5 bg-accent/20 text-accent rounded-full inline-block"><Check className="size-3 stroke-4" /></div>
                              ) : (
                                <Minus className="size-4 text-muted-foreground/20 mx-auto" />
                              )
                            ) : (
                              <span className="text-sm">{feature.basic}</span>
                            )}
                          </td>
                          <td className="py-5 px-6 text-center bg-white/5 font-bold">
                            {typeof feature.pro === "boolean" ? (
                              feature.pro ? (
                                <div className="p-1.5 bg-accent/20 text-accent rounded-full inline-block"><Check className="size-3 stroke-4" /></div>
                              ) : (
                                <Minus className="size-4 text-muted-foreground/20 mx-auto" />
                              )
                            ) : (
                              <span className="text-sm font-black text-accent">{feature.pro}</span>
                            )}
                          </td>
                          <td className="py-5 px-6 text-center font-bold">
                            {typeof feature.enterprise === "boolean" ? (
                              feature.enterprise ? (
                                <div className="p-1.5 bg-accent/20 text-accent rounded-full inline-block"><Check className="size-3 stroke-4" /></div>
                              ) : (
                                <Minus className="size-4 text-muted-foreground/20 mx-auto" />
                              )
                            ) : (
                              <span className="text-sm">{feature.enterprise}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </m.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 relative z-10 bg-cinematic/50">
        <div className="container mx-auto px-4 lg:px-8">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-20 space-y-4"
          >
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-premium border border-white/10 text-accent text-[10px] font-black uppercase tracking-[0.3em] mb-4">
              <HelpCircle className="size-3" />
              <span>Support</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter">
              Câu hỏi <span className="font-serif italic text-muted-foreground/60">thường gặp</span>
            </h2>
          </m.div>

          <div className="max-w-4xl mx-auto grid gap-6">
            {faqs.map((faq, index) => (
              <m.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card border-none rounded-3xl p-8 hover:bg-white/10 transition-all duration-500 shadow-xl"
              >
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
                    <HelpCircle className="size-6 text-accent" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold tracking-tight">{faq.question}</h3>
                    <p className="text-muted-foreground font-medium leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative z-10">
        <div className="container mx-auto px-4 lg:px-8">
          <m.div 
             className="relative rounded-[3rem] overflow-hidden bg-white p-12 md:p-24 text-center group"
             initial={{ opacity: 0, scale: 0.95 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
          >
            {/* CTA Background Pattern */}
            <div className="absolute inset-0 bg-(--aurora-blue)/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="absolute top-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-[100px] -ml-32 -mt-32" />
            
            <div className="max-w-3xl mx-auto relative z-10 space-y-10">
              <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-black">
                Sẵn sàng <span className="font-serif italic font-normal text-black/40">bắt đầu?</span>
              </h2>
              <p className="text-xl md:text-2xl text-black/60 font-medium">
                Tạo cửa hàng miễn phí ngay hôm nay, không cần thẻ tín dụng.
              </p>
              <div className="flex flex-wrap justify-center gap-6">
                <Button size="lg" className="h-20 px-12 rounded-2xl bg-black text-white hover:bg-black/90 font-black uppercase tracking-widest text-xs shadow-2xl hover:scale-105 transition-all" asChild>
                  <Link href="/register">
                    Bắt đầu miễn phí
                    <ArrowRight className="size-4 ml-2" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-20 px-12 rounded-2xl border-black/10 text-black hover:bg-black/5 font-black uppercase tracking-widest text-xs hover:scale-105 transition-all"
                  asChild
                >
                  <Link href="/contact">Liên hệ tư vấn</Link>
                </Button>
              </div>
            </div>
          </m.div>
        </div>
      </section>
    </main>
  );
}
