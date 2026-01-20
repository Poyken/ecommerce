"use client";

/**
 * =====================================================================
 * PRICING PAGE - Bảng giá chi tiết các gói dịch vụ
 * =====================================================================
 */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { m, Variants } from "framer-motion";
import {
  ArrowRight,
  Check,
  HelpCircle,
  Minus,
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
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-background to-background" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 lg:px-8 text-center">
          <m.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-3xl mx-auto"
          >
            <m.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
            >
              <Sparkles className="size-4" />
              <span>Bắt đầu miễn phí, nâng cấp khi cần</span>
            </m.div>

            <m.h1
              variants={fadeInUp}
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
            >
              Chọn gói phù hợp với{" "}
              <span className="text-primary">doanh nghiệp của bạn</span>
            </m.h1>

            <m.p
              variants={fadeInUp}
              className="text-xl text-muted-foreground mb-10"
            >
              Linh hoạt nâng cấp theo nhu cầu. Không phí ẩn. Hủy bất cứ lúc nào.
            </m.p>

            {/* Billing Toggle */}
            <m.div
              variants={fadeInUp}
              className="inline-flex items-center gap-4 p-1 rounded-full bg-muted"
            >
              <button
                onClick={() => setBillingCycle("monthly")}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-medium transition-all",
                  billingCycle === "monthly"
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Hàng tháng
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                  billingCycle === "yearly"
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Hàng năm
                <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500 text-white">
                  -17%
                </span>
              </button>
            </m.div>
          </m.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <m.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "relative rounded-3xl p-8 border transition-all duration-300 flex flex-col justify-between h-full",
                  plan.isPopular
                    ? "bg-primary text-primary-foreground border-primary scale-105 shadow-2xl shadow-primary/20"
                    : "bg-card border-border hover:border-primary/50 hover:shadow-lg"
                )}
              >
                <div className="flex-1">
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-lg">
                        <Zap className="size-4" />
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  {/* Plan Name */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p
                      className={cn(
                        "text-sm",
                        plan.isPopular
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      )}
                    >
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        {formatPrice(
                          billingCycle === "monthly"
                            ? plan.priceMonthly
                            : plan.priceYearly,
                          plan.currency
                        )}
                      </span>
                      {plan.priceMonthly !== null && (
                        <span
                          className={cn(
                            "text-sm",
                            plan.isPopular
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          )}
                        >
                          /{billingCycle === "monthly" ? "tháng" : "năm"}
                        </span>
                      )}
                    </div>
                    {billingCycle === "yearly" && plan.priceMonthly && (
                      <p
                        className={cn(
                          "text-sm mt-1",
                          plan.isPopular
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        )}
                      >
                        Tiết kiệm{" "}
                        {formatPrice(
                          plan.priceMonthly * 12 - (plan.priceYearly || 0),
                          plan.currency
                        )}
                      </p>
                    )}
                  </div>

                  {/* CTA Button (Moved Back Up) */}
                  <Button
                    size="lg"
                    className={cn(
                      "w-full mb-8",
                      plan.isPopular
                        ? "bg-white text-primary hover:bg-white/90"
                        : ""
                    )}
                    variant={plan.isPopular ? "secondary" : "default"}
                    asChild
                  >
                    <Link href={plan.ctaLink as "/register" | "/contact"}>
                      {plan.cta}
                      <ArrowRight className="size-4 ml-2" />
                    </Link>
                  </Button>

                  {/* Features List */}
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature.name} className="flex items-center gap-3">
                        {feature.included ? (
                          <Check
                            className={cn(
                              "size-5 shrink-0",
                              plan.isPopular
                                ? "text-primary-foreground"
                                : "text-primary"
                            )}
                          />
                        ) : (
                          <X
                            className={cn(
                              "size-5 shrink-0",
                              plan.isPopular
                                ? "text-primary-foreground/40"
                                : "text-muted-foreground/40"
                            )}
                          />
                        )}
                        <span
                          className={cn(
                            "text-sm",
                            !feature.included &&
                              (plan.isPopular
                                ? "text-primary-foreground/50"
                                : "text-muted-foreground/50")
                          )}
                        >
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              So sánh chi tiết các gói
            </h2>
            <p className="text-lg text-muted-foreground">
              Xem đầy đủ các tính năng của từng gói để đưa ra lựa chọn phù hợp
              nhất
            </p>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overflow-x-auto"
          >
            <table className="w-full min-w-[800px] border-collapse bg-card rounded-2xl overflow-hidden">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-6 px-6 text-left font-semibold">
                    Tính năng
                  </th>
                  <th className="py-6 px-6 text-center font-semibold">Basic</th>
                  <th className="py-6 px-6 text-center font-semibold bg-primary/5">
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-primary font-medium mb-1">
                        Phổ biến
                      </span>
                      Pro
                    </div>
                  </th>
                  <th className="py-6 px-6 text-center font-semibold">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((category) => (
                  <React.Fragment key={category.category}>
                    <tr className="bg-muted/50">
                      <td
                        colSpan={4}
                        className="py-3 px-6 font-semibold text-sm"
                      >
                        {category.category}
                      </td>
                    </tr>
                    {category.features.map((feature, idx) => (
                      <tr key={idx} className="border-b border-border/50">
                        <td className="py-4 px-6 text-sm">{feature.name}</td>
                        <td className="py-4 px-6 text-center">
                          {typeof feature.basic === "boolean" ? (
                            feature.basic ? (
                              <Check className="size-5 text-primary mx-auto" />
                            ) : (
                              <Minus className="size-5 text-muted-foreground/40 mx-auto" />
                            )
                          ) : (
                            <span className="text-sm">{feature.basic}</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center bg-primary/5">
                          {typeof feature.pro === "boolean" ? (
                            feature.pro ? (
                              <Check className="size-5 text-primary mx-auto" />
                            ) : (
                              <Minus className="size-5 text-muted-foreground/40 mx-auto" />
                            )
                          ) : (
                            <span className="text-sm font-medium">
                              {feature.pro}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center">
                          {typeof feature.enterprise === "boolean" ? (
                            feature.enterprise ? (
                              <Check className="size-5 text-primary mx-auto" />
                            ) : (
                              <Minus className="size-5 text-muted-foreground/40 mx-auto" />
                            )
                          ) : (
                            <span className="text-sm">
                              {feature.enterprise}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </m.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Câu hỏi thường gặp
            </h2>
            <p className="text-lg text-muted-foreground">
              Những thắc mắc phổ biến về pricing và billing
            </p>
          </m.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <m.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <div className="flex items-start gap-4">
                  <HelpCircle className="size-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-2">{faq.question}</h3>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </div>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Sẵn sàng bắt đầu?
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-8">
              Tạo cửa hàng miễn phí ngay hôm nay, không cần thẻ tín dụng.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/register">
                  Bắt đầu miễn phí
                  <ArrowRight className="size-4 ml-2" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <Link href="/contact">Liên hệ tư vấn</Link>
              </Button>
            </div>
          </m.div>
        </div>
      </section>
    </main>
  );
}
