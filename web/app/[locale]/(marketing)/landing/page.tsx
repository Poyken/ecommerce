"use client";

import { Button } from "@/components/ui/button";
import { m, useInView, Variants } from "framer-motion";
import {
  ArrowRight,
  Bot,
  ChevronRight,
  Globe,
  Layers,
  MessageCircle,
  Package,
  RefreshCcw,
  Shield,
  Sparkles,
  Star,
  Store,
  Tags,
  Trophy,
  Users,
  Wallet,
  Warehouse,
  Zap,
  Check,
  Menu,
  X,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { useRef, useState } from "react";

// ============================================================================
// DATA - Dummy data cho các tính năng
// ============================================================================

const coreFeatures = [
  {
    icon: Globe,
    title: "Multi-tenant & Custom Domain",
    description:
      "Mỗi cửa hàng một không gian riêng biệt, hỗ trợ tên miền riêng và chứng chỉ SSL tự động. Quản lý đa cửa hàng từ một dashboard duy nhất.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Warehouse,
    title: "Quản lý Đa kho (Multi-warehouse)",
    description:
      "Tự động điều phối hàng hóa từ nhiều kho khác nhau. Theo dõi tồn kho real-time và cảnh báo khi hàng sắp hết.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: Users,
    title: "Bán buôn B2B (Price Lists)",
    description:
      "Thiết lập bảng giá riêng cho từng nhóm khách hàng đại lý, VIP. Hỗ trợ báo giá tự động và quy trình duyệt đơn.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Bot,
    title: "AI Assistant (Gemini)",
    description:
      "Chatbot tư vấn bán hàng thông minh sử dụng Google Gemini. Tự động phân tích cảm xúc đánh giá khách hàng.",
    gradient: "from-orange-500 to-red-500",
  },
];

const growthFeatures = [
  {
    icon: Tags,
    title: "Khuyến mãi động",
    description:
      "Tạo coupon, flash sale với Rule Engine mạnh mẽ. Hỗ trợ giảm giá theo %, cố định, freeship, tặng quà.",
  },
  {
    icon: Trophy,
    title: "Affiliate & Loyalty",
    description:
      "Tiếp thị liên kết và tích điểm thành viên tích hợp sẵn. Theo dõi hoa hồng và điểm thưởng real-time.",
  },
  {
    icon: RefreshCcw,
    title: "Đổi trả RMA chuyên nghiệp",
    description:
      "Quy trình đổi trả hàng hoàn chỉnh với nhiều phương thức hoàn tiền linh hoạt.",
  },
  {
    icon: MessageCircle,
    title: "Chat Đa kênh",
    description:
      "Quản lý tin nhắn từ khách hàng tập trung. Hỗ trợ gửi sản phẩm, đơn hàng trực tiếp trong chat.",
  },
];

const operationFeatures = [
  {
    icon: Package,
    title: "Partial Fulfillment",
    description: "Tách đơn thành nhiều shipment, giao hàng từ nhiều kho.",
  },
  {
    icon: Layers,
    title: "Multi-currency",
    description: "Hỗ trợ VND, USD và nhiều loại tiền tệ khác.",
  },
  {
    icon: Shield,
    title: "RBAC & 2FA",
    description: "Phân quyền chi tiết và bảo mật hai lớp.",
  },
  {
    icon: Zap,
    title: "Performance Metrics",
    description: "Theo dõi Core Web Vitals real-time.",
  },
];

const pricingPlans = [
  {
    name: "BASIC",
    price: "499.000",
    description: "Hoàn hảo cho cửa hàng mới bắt đầu",
    features: [
      "1 Kho hàng",
      "100 Sản phẩm",
      "2 Nhân viên",
      "SSL miễn phí",
      "Hỗ trợ email",
      "Báo cáo cơ bản",
    ],
    cta: "Bắt đầu miễn phí",
    popular: false,
  },
  {
    name: "PRO",
    price: "1.499.000",
    description: "Dành cho doanh nghiệp đang mở rộng",
    features: [
      "5 Kho hàng",
      "1.000 Sản phẩm",
      "10 Nhân viên",
      "Custom Domain",
      "AI Chatbot",
      "B2B Price Lists",
      "Affiliate System",
      "Priority Support",
    ],
    cta: "Nâng cấp Pro",
    popular: true,
  },
  {
    name: "ENTERPRISE",
    price: "Liên hệ",
    description: "Giải pháp tùy chỉnh cho doanh nghiệp lớn",
    features: [
      "Kho không giới hạn",
      "Sản phẩm không giới hạn",
      "Nhân viên không giới hạn",
      "Multi-tenant API",
      "Custom Integrations",
      "SLA 99.9%",
      "Dedicated Support",
      "On-premise Option",
    ],
    cta: "Liên hệ Sales",
    popular: false,
  },
];

const stats = [
  { value: "10,000+", label: "Cửa hàng" },
  { value: "99.9%", label: "Uptime" },
  { value: "5M+", label: "Đơn hàng/tháng" },
  { value: "24/7", label: "Hỗ trợ" },
];

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

// ============================================================================
// COMPONENTS
// ============================================================================

function AnimatedSection({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <m.section
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={staggerContainer}
      className={className}
      id={id}
    >
      {children}
    </m.section>
  );
}


function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-8 lg:pt-16 pb-20 overflow-hidden">
      {/* Background Effects - Aurora Glows */}
      <div className="absolute inset-0 bg-cinematic" />
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[var(--aurora-blue)]/20 rounded-full blur-[120px] animate-pulse-glow" />
      <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] bg-[var(--aurora-purple)]/20 rounded-full blur-[100px] animate-float" />
      <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] bg-[var(--aurora-orange)]/10 rounded-full blur-[80px] animate-float-delayed" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Content */}
          <m.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-6"
            >
              <Sparkles className="size-4" />
              <span>Tích hợp AI Gemini mới nhất</span>
            </m.div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Nền tảng{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Thương mại điện tử
              </span>{" "}
              Đa kênh & B2B
            </h1>

            {/* Sub-headline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8">
              Tạo cửa hàng trực tuyến của riêng bạn chỉ trong{" "}
              <span className="font-semibold text-foreground">30 giây</span>.
              Tích hợp sẵn AI, Quản lý đa kho và Bán buôn B2B.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
              <Button
                size="lg"
                variant="aurora"
                className="group"
                asChild
              >
                <Link href="/register">
                  Dùng thử miễn phí
                  <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="glass"
                className="group"
                asChild
              >
                <Link href="/demo">
                  Xem Demo Store
                  <ChevronRight className="size-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <m.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="text-center lg:text-left"
                >
                  <div className="text-2xl md:text-3xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </m.div>
              ))}
            </div>
          </m.div>

          {/* Right: Hero Image / Dashboard Mockup */}
          <m.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="relative"
          >
            <div className="relative group">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border/50 shadow-2xl shadow-indigo-500/10">
                {/* Dashboard Preview */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800 p-4">
                  {/* Top Bar */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex gap-1.5">
                      <div className="size-3 rounded-full bg-red-500" />
                      <div className="size-3 rounded-full bg-yellow-500" />
                      <div className="size-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex-1 h-6 bg-white/10 rounded-md mx-4" />
                  </div>

                  {/* Dashboard Content */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-20 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10"
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-32 rounded-lg bg-white/5 border border-white/10" />
                    <div className="h-32 rounded-lg bg-white/5 border border-white/10" />
                  </div>

                  <div className="mt-3 h-24 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-white/10" />
                </div>
              </div>

              {/* Floating Elements - Moved outside the overflow-hidden container */}
              <m.div
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -top-6 -right-6 p-3 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-border z-20"
              >
                <Wallet className="size-6 text-green-500" />
              </m.div>

              <m.div
                animate={{ y: [0, 10, 0] }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -bottom-6 -left-6 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-border flex items-center gap-2 z-20 whitespace-nowrap"
              >
                <Star className="size-5 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-semibold">4.9/5 Rating</span>
              </m.div>
            </div>
          </m.div>
        </div>
      </div>
    </section>
  );
}

function CoreFeaturesSection() {
  return (
    <AnimatedSection className="py-20 lg:py-32 bg-secondary/30" id="features">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <m.div
          variants={fadeInUp}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Tính năng{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              cốt lõi
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Mọi thứ bạn cần để xây dựng và vận hành một cửa hàng thương mại điện
            tử chuyên nghiệp
          </p>
        </m.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {coreFeatures.map((feature, index) => (
            <m.div
              key={feature.title}
              variants={scaleIn}
              className="group relative p-6 lg:p-8 rounded-2xl glass-card transition-all duration-500 hover:-translate-y-2 overflow-hidden"
            >
              {/* Icon */}
              <div
                className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 shadow-lg`}
              >
                <feature.icon className="size-6 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold mb-2 font-sans tracking-tight">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {feature.description}
              </p>

              {/* Decorative Glow */}
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
            </m.div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}

function GrowthToolsSection() {
  return (
    <AnimatedSection className="py-20 lg:py-32">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Content */}
          <m.div variants={fadeInUp}>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
              Giải pháp{" "}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                Tăng trưởng
              </span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Công cụ marketing và bán hàng mạnh mẽ để tăng tốc doanh thu và giữ
              chân khách hàng
            </p>

            <div className="space-y-6">
              {growthFeatures.map((feature, index) => (
                <m.div
                  key={feature.title}
                  variants={fadeInUp}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0 size-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <feature.icon className="size-6 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </m.div>
              ))}
            </div>
          </m.div>

          {/* Right: Illustration */}
          <m.div variants={scaleIn} className="relative">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 p-8 lg:p-12">
              {/* Growth Chart Mockup */}
              <div className="h-full flex flex-col justify-end gap-3">
                <div className="flex items-end gap-3 h-full">
                  {[40, 55, 45, 70, 60, 85, 75, 95].map((height, i) => (
                    <m.div
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${height}%` }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      className="flex-1 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg"
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Aug</span>
                </div>
              </div>

              {/* Floating Stats */}
              <m.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 right-8 px-4 py-3 rounded-xl bg-card border shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-medium">+127% Doanh thu</span>
                </div>
              </m.div>
            </div>
          </m.div>
        </div>
      </div>
    </AnimatedSection>
  );
}

function OperationsSection() {
  return (
    <AnimatedSection className="py-20 lg:py-32 bg-secondary/30">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <m.div
          variants={fadeInUp}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Vận hành{" "}
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              chuyên nghiệp
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Tự động hóa quy trình, tối ưu hiệu suất và bảo mật dữ liệu
          </p>
        </m.div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {operationFeatures.map((feature, index) => (
            <m.div
              key={feature.title}
              variants={scaleIn}
              className="p-6 rounded-2xl bg-card border border-border text-center hover:border-orange-500/50 transition-all duration-300"
            >
              <div className="inline-flex p-3 rounded-xl bg-orange-500/10 mb-4">
                <feature.icon className="size-6 text-orange-500" />
              </div>
              <h3 className="font-semibold mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </m.div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}

function PricingSection() {
  return (
    <AnimatedSection className="py-20 lg:py-32" id="pricing">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <m.div
          variants={fadeInUp}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Bảng giá{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              minh bạch
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Chọn gói phù hợp với quy mô kinh doanh của bạn. Không phí ẩn, hủy
            bất kỳ lúc nào.
          </p>
        </m.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <m.div
              key={plan.name}
              variants={scaleIn}
              className={`relative p-6 lg:p-8 rounded-2xl border ${
                plan.popular
                  ? "border-[var(--aurora-purple)] bg-[var(--aurora-purple)]/5 shadow-[0_0_40px_-10px_var(--aurora-purple)]"
                  : "glass-card"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-medium">
                  Phổ biến nhất
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.price !== "Liên hệ" && (
                    <span className="text-muted-foreground">đ/tháng</span>
                  )}
                </div>
              </div>

              {/* Features List */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="size-4 text-emerald-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                className={`w-full ${
                  plan.popular
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    : ""
                }`}
                variant={plan.popular ? "default" : "outline"}
                asChild
              >
                <Link href="/register">{plan.cta}</Link>
              </Button>
            </m.div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}

function CTASection() {
  return (
    <AnimatedSection className="py-20 lg:py-32">
      <div className="container mx-auto px-4 lg:px-8">
        <m.div
          variants={scaleIn}
          className="relative rounded-3xl overflow-hidden"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--aurora-blue)] via-[var(--aurora-purple)] to-[var(--aurora-orange)]" />
          <div className="absolute inset-0 bg-cinematic opacity-50" />
          <div className="absolute -top-[50%] -left-[50%] w-[100%] h-[100%] bg-white/10 rounded-full blur-[120px] animate-pulse-glow" />

          {/* Content */}
          <div className="relative z-10 py-16 lg:py-24 px-8 lg:px-16 text-center text-white">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Sẵn sàng bắt đầu?
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
              Tham gia cùng hơn 10,000 doanh nghiệp đang sử dụng Luxe SaaS để
              tăng trưởng kinh doanh online
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="premium"
                className="hover:scale-105 transition-transform"
                asChild
              >
                <Link href="/register">
                  Dùng thử miễn phí 14 ngày
                  <ArrowRight className="size-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/demo">Đặt lịch demo</Link>
              </Button>
            </div>
          </div>
        </m.div>
      </div>
    </AnimatedSection>
  );
}


// ============================================================================
// MAIN PAGE
// ============================================================================

export default function MarketingPage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <CoreFeaturesSection />
      <GrowthToolsSection />
      <OperationsSection />
      <PricingSection />
      <CTASection />
    </main>
  );
}
