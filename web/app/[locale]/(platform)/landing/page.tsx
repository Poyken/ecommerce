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
    <section className="relative min-h-[90vh] flex items-center pt-24 lg:pt-32 pb-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-cinematic" />
      
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Content */}
          <m.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-premium text-sm font-medium mb-8 text-foreground/80"
            >
              <Sparkles className="size-4 text-indigo-500 fill-indigo-500" />
              <span>New: Intelligent Inventory Management</span>
            </m.div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6 font-sans">
              Scale Your <br />
              <span className="text-gradient-luxury">E-Commerce Empire</span>
            </h1>

            {/* Sub-headline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed font-light">
              The only multi-tenant platform designed for high-growth brands. 
              Launch in <span className="text-foreground font-semibold">30 seconds</span> with built-in AI and Global Fulfillment.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Button
                size="lg"
                className="rounded-full h-14 px-8 text-base bg-primary text-primary-foreground hover:scale-105 transition-transform duration-300 shadow-xl shadow-primary/20"
                asChild
              >
                <Link href="/register">
                  Start Free Trial
                  <ArrowRight className="size-5 ml-2" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full h-14 px-8 text-base border-white/20 hover:bg-white/5 backdrop-blur-sm"
                asChild
              >
                <Link href="/demo">
                  View Live Demo
                </Link>
              </Button>
            </div>

            {/* Social Proof */}
            <div className="pt-8 border-t border-border/50">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Trusted by 10,000+ Brands</p>
                <div className="flex flex-wrap justify-center lg:justify-start gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                    {/* Placeholder Logos */}
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-8 w-24 bg-foreground/20 rounded-md animate-pulse" />
                    ))}
                </div>
            </div>
          </m.div>

          {/* Right: Hero Image / Dashboard Mockup */}
          <m.div
            initial={{ opacity: 0, scale: 0.95, rotateY: 10 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="relative lg:perspective-1000"
          >
            <div className="relative group rounded-2xl border border-white/10 shadow-2xl glass-card p-2 backdrop-blur-3xl lg:rotate-y-[-5deg] lg:rotate-x-[5deg] transition-transform duration-700 hover:rotate-0">
               <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-2xl pointer-events-none" />
                {/* Dashboard Image Placeholder */}
               <div className="aspect-[16/10] rounded-xl overflow-hidden bg-slate-950 border border-white/5 relative">
                    <div className="absolute inset-x-0 top-0 h-10 bg-white/5 border-b border-white/5 flex items-center px-4 gap-2">
                        <div className="flex gap-1.5">
                            <div className="size-3 rounded-full bg-[#FF5F56]" />
                            <div className="size-3 rounded-full bg-[#FFBD2E]" />
                            <div className="size-3 rounded-full bg-[#27C93F]" />
                        </div>
                    </div>
                    {/* Mock Content */}
                    <div className="mt-14 px-6 grid grid-cols-3 gap-4">
                        <div className="h-24 bg-white/5 rounded-lg border border-white/5 animate-pulse" />
                        <div className="h-24 bg-white/5 rounded-lg border border-white/5 animate-pulse delay-100" />
                        <div className="h-24 bg-white/5 rounded-lg border border-white/5 animate-pulse delay-200" />
                    </div>
               </div>
            </div>
            
            {/* Floating Widgets */}
            <div className="absolute -left-10 top-1/2 -translate-y-1/2 p-4 glass-premium rounded-2xl animate-float-delayed hidden lg:block">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                        <Trophy className="size-5" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Revenue Growth</p>
                        <p className="text-lg font-bold text-gradient">+145%</p>
                    </div>
                </div>
            </div>
          </m.div>
        </div>
      </div>
    </section>
  );
}

function CoreFeaturesSection() {
  return (
    <AnimatedSection className="py-24 lg:py-32" id="features">
      <div className="container mx-auto px-4 lg:px-8">
        <m.div variants={fadeInUp} className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 font-sans">
            Built for <span className="text-gradient-luxury">Enterprise Scale</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to build, scale, and manage your e-commerce business.
          </p>
        </m.div>

        {/* Bento Grid */}
        <div className="grid md:grid-cols-3 gap-6 auto-rows-[minmax(280px,auto)]">
          {coreFeatures.map((feature, index) => (
            <m.div
              key={feature.title}
              variants={scaleIn}
              className={`group bento-cell p-8 flex flex-col justify-between ${
                index === 0 || index === 3 ? "md:col-span-2" : ""
              }`}
            >
              <div>
                <div
                  className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-6 shadow-lg`}
                >
                  <feature.icon className="size-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
              
              {/* Illustration Placeholder */}
              <div className="mt-8 h-32 w-full bg-white/5 rounded-lg border border-white/5 relative overflow-hidden group-hover:bg-white/10 transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent" />
              </div>
            </m.div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}

function GrowthToolsSection() {
  return (
    <AnimatedSection className="py-24 lg:py-32">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Content */}
          <m.div variants={fadeInUp}>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-8 font-sans">
              Accelerate with <br />
              <span className="text-gradient-luxury">Growth Engines</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed font-light">
              Don't just launch—dominate. Our built-in marketing suite is designed to maximize LTV and retention from day one.
            </p>

            <div className="space-y-6">
              {growthFeatures.map((feature, index) => (
                <m.div
                  key={feature.title}
                  variants={fadeInUp}
                  className="flex gap-5 group"
                >
                  <div className="flex-shrink-0 size-12 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <feature.icon className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1 tracking-tight">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      {feature.description}
                    </p>
                  </div>
                </m.div>
              ))}
            </div>
          </m.div>

          {/* Right: Illustration */}
          <m.div variants={scaleIn} className="relative">
            <div className="aspect-square rounded-3xl glass-card border-white/10 p-8 lg:p-12 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5" />
              
              {/* Growth Chart Mockup */}
              <div className="h-full flex flex-col justify-end gap-3 relative z-10">
                <div className="flex items-end gap-3 h-full">
                  {[40, 55, 45, 70, 60, 85, 75, 95].map((height, i) => (
                    <m.div
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${height}%` }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      className="flex-1 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity"
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground/50">
                  <span>Jan</span>
                  <span>Aug</span>
                </div>
              </div>

              {/* Floating Stats */}
              <m.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute top-10 right-10 px-5 py-4 rounded-2xl glass-premium z-20"
              >
                <div className="flex items-center gap-3">
                  <div className="size-3 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Revenue</p>
                    <p className="text-xl font-bold">+127% YoY</p>
                  </div>
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
    <AnimatedSection className="py-24 lg:py-32 bg-secondary/20">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <m.div
          variants={fadeInUp}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 font-sans">
            Operations <span className="text-gradient-luxury">Redefined</span>
          </h2>
          <p className="text-lg text-muted-foreground font-light">
            Automate the boring stuff. Focus on strategy. We handle the heavy lifting of logistics, taxes, and security.
          </p>
        </m.div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {operationFeatures.map((feature, index) => (
            <m.div
              key={feature.title}
              variants={scaleIn}
              className="p-8 rounded-2xl glass-card text-center hover:border-foreground/20 transition-all duration-300 group"
            >
              <div className="inline-flex p-4 rounded-full bg-secondary mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="size-6 text-foreground" />
              </div>
              <h3 className="font-bold mb-2 tracking-tight">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
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
    <AnimatedSection className="py-24 lg:py-32" id="pricing">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <m.div
          variants={fadeInUp}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 font-sans">
            Transparent <span className="text-gradient-luxury">Pricing</span>
          </h2>
          <p className="text-lg text-muted-foreground font-light">
            Start small, scale big. No hidden fees. Cancel anytime.
          </p>
        </m.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <m.div
              key={plan.name}
              variants={scaleIn}
              className={`relative p-8 rounded-3xl border transition-all duration-500 hover:-translate-y-2 ${
                plan.popular
                  ? "border-primary/50 bg-secondary/50 shadow-2xl shadow-primary/10"
                  : "glass-card"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest shadow-lg">
                  Most Popular
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1 mb-4">
                   {plan.price !== "Liên hệ" && <span className="text-sm align-top text-muted-foreground">$</span>}
                  <span className="text-5xl font-black tracking-tighter">{plan.price}</span>
                  {plan.price !== "Liên hệ" && (
                    <span className="text-muted-foreground text-sm font-medium">/mo</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {plan.description}
                </p>
              </div>

              {/* CTA Button */}
              <Button
                className={`w-full rounded-full h-12 mb-8 ${
                  plan.popular
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "variant-outline border-border hover:bg-secondary"
                }`}
                variant={plan.popular ? "default" : "outline"}
                asChild
              >
                <Link href="/register">{plan.cta}</Link>
              </Button>

              {/* Features List */}
              <div className="pt-8 border-t border-border/50">
                <ul className="space-y-4">
                    {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <Check className="size-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                    </li>
                    ))}
                </ul>
              </div>
            </m.div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}

function CTASection() {
  return (
    <AnimatedSection className="py-24 lg:py-32">
      <div className="container mx-auto px-4 lg:px-8">
        <m.div
          variants={scaleIn}
          className="relative rounded-[2.5rem] overflow-hidden group"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-primary" />
           <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[url('/noise.svg')] opacity-10" />
           <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/50 to-purple-600/50 mix-blend-overlay" />
          
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 py-20 lg:py-32 px-8 lg:px-16 text-center text-primary-foreground">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8 font-sans">
              Ready to <span className="italic font-serif">Dominate?</span>
            </h2>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-12 font-light">
              Join 10,000+ brands scaling with Luxe SaaS. 
              No credit card required for trial.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-background text-foreground hover:scale-105 transition-transform rounded-full h-14 px-8 text-base font-semibold"
                asChild
              >
                <Link href="/register">
                  Start 14-Day Free Trial
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 rounded-full h-14 px-8 text-base"
                asChild
              >
                <Link href="/demo">Book a Demo</Link>
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
