"use client";

/**
 * =====================================================================
 * FEATURES PAGE - Giới thiệu tất cả tính năng của platform
 * =====================================================================
 */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { m } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Building2,
  CreditCard,
  Globe,
  Headphones,
  Layers,
  LineChart,
  Lock,
  Package,
  Palette,
  RefreshCcw,
  Shield,
  Smartphone,
  Sparkles,
  Users,
  Warehouse,
  Zap,
} from "lucide-react";
import { Link } from "@/i18n/routing";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

// Feature Categories
const featureCategories = [
  {
    id: "core",
    title: "Tính năng cốt lõi",
    description: "Nền tảng vững chắc cho mọi cửa hàng",
    icon: <Layers className="size-6" />,
    features: [
      {
        icon: <Building2 className="size-6" />,
        title: "Multi-tenant Architecture",
        description:
          "Mỗi cửa hàng là một tenant độc lập với subdomain riêng, dữ liệu tách biệt hoàn toàn.",
      },
      {
        icon: <Globe className="size-6" />,
        title: "Custom Domain",
        description:
          "Kết nối tên miền riêng của bạn với SSL miễn phí, tự động cấu hình DNS.",
      },
      {
        icon: <Palette className="size-6" />,
        title: "Theme Customization",
        description:
          "Tùy chỉnh giao diện với drag-drop page builder, không cần code.",
      },
      {
        icon: <Smartphone className="size-6" />,
        title: "Mobile-first Design",
        description:
          "Giao diện tối ưu cho mọi thiết bị, tăng tỷ lệ chuyển đổi trên mobile.",
      },
    ],
  },
  {
    id: "inventory",
    title: "Quản lý Kho & Sản phẩm",
    description: "Kiểm soát tồn kho chính xác và hiệu quả",
    icon: <Package className="size-6" />,
    features: [
      {
        icon: <Warehouse className="size-6" />,
        title: "Multi-warehouse",
        description:
          "Quản lý nhiều kho hàng, theo dõi tồn kho real-time, tự động phân bổ đơn hàng.",
      },
      {
        icon: <Layers className="size-6" />,
        title: "Product Variants",
        description:
          "Hỗ trợ sản phẩm có nhiều biến thể (size, màu, chất liệu) với SKU riêng.",
      },
      {
        icon: <BarChart3 className="size-6" />,
        title: "Inventory Tracking",
        description:
          "Cảnh báo hết hàng, lịch sử xuất nhập kho, báo cáo tồn kho chi tiết.",
      },
      {
        icon: <RefreshCcw className="size-6" />,
        title: "Bulk Operations",
        description:
          "Import/Export hàng loạt qua Excel/CSV, cập nhật đồng bộ nhanh chóng.",
      },
    ],
  },
  {
    id: "sales",
    title: "Bán hàng & Thanh toán",
    description: "Xử lý đơn hàng nhanh chóng, chính xác",
    icon: <CreditCard className="size-6" />,
    features: [
      {
        icon: <CreditCard className="size-6" />,
        title: "Multi-payment Gateway",
        description:
          "Tích hợp sẵn VNPay, MoMo, ZaloPay, Stripe. Thanh toán COD, chuyển khoản.",
      },
      {
        icon: <Package className="size-6" />,
        title: "Partial Fulfillment",
        description:
          "Giao hàng từng phần, xử lý backorder tự động khi hết hàng tạm thời.",
      },
      {
        icon: <Globe className="size-6" />,
        title: "Multi-currency",
        description:
          "Bán hàng bằng nhiều loại tiền tệ, tự động chuyển đổi tỷ giá.",
      },
      {
        icon: <RefreshCcw className="size-6" />,
        title: "Return & Refund (RMA)",
        description:
          "Quy trình đổi trả chuyên nghiệp, theo dõi trạng thái, hoàn tiền tự động.",
      },
    ],
  },
  {
    id: "b2b",
    title: "B2B & Wholesale",
    description: "Giải pháp cho bán sỉ và doanh nghiệp",
    icon: <Users className="size-6" />,
    features: [
      {
        icon: <Users className="size-6" />,
        title: "Customer Groups",
        description:
          "Phân nhóm khách hàng: VIP, Đại lý, Bán lẻ... với ưu đãi riêng.",
      },
      {
        icon: <CreditCard className="size-6" />,
        title: "B2B Price Lists",
        description:
          "Bảng giá riêng cho từng nhóm khách hàng, giá theo số lượng.",
      },
      {
        icon: <Lock className="size-6" />,
        title: "Quote & Negotiation",
        description:
          "Cho phép khách hàng B2B yêu cầu báo giá, thương lượng giá.",
      },
      {
        icon: <BarChart3 className="size-6" />,
        title: "Credit Limit",
        description:
          "Thiết lập hạn mức công nợ, theo dõi thanh toán của đại lý.",
      },
    ],
  },
  {
    id: "marketing",
    title: "Marketing & Promotion",
    description: "Công cụ tăng trưởng mạnh mẽ",
    icon: <Sparkles className="size-6" />,
    features: [
      {
        icon: <Sparkles className="size-6" />,
        title: "Dynamic Promotions",
        description:
          "Tạo khuyến mãi với nhiều điều kiện: theo sản phẩm, danh mục, giá trị đơn, thời gian.",
      },
      {
        icon: <Users className="size-6" />,
        title: "Affiliate System",
        description:
          "Chương trình tiếp thị liên kết, theo dõi hoa hồng, thanh toán tự động.",
      },
      {
        icon: <CreditCard className="size-6" />,
        title: "Loyalty Points",
        description:
          "Tích điểm thưởng, đổi điểm lấy voucher, tăng khách hàng quay lại.",
      },
      {
        icon: <BarChart3 className="size-6" />,
        title: "Email Marketing",
        description:
          "Gửi email tự động: welcome, abandon cart, order confirmation.",
      },
    ],
  },
  {
    id: "ai",
    title: "AI & Automation",
    description: "Trí tuệ nhân tạo hỗ trợ 24/7",
    icon: <Bot className="size-6" />,
    features: [
      {
        icon: <Bot className="size-6" />,
        title: "AI Chatbot",
        description:
          "Chatbot thông minh tích hợp Gemini, trả lời câu hỏi, hỗ trợ mua hàng 24/7.",
      },
      {
        icon: <Sparkles className="size-6" />,
        title: "Smart Recommendations",
        description:
          "Gợi ý sản phẩm thông minh dựa trên hành vi mua hàng và lịch sử xem.",
      },
      {
        icon: <LineChart className="size-6" />,
        title: "Sentiment Analysis",
        description:
          "Phân tích cảm xúc đánh giá sản phẩm, cảnh báo review tiêu cực.",
      },
      {
        icon: <Zap className="size-6" />,
        title: "Auto-tagging",
        description:
          "Tự động gắn tag và phân loại sản phẩm dựa trên mô tả và hình ảnh.",
      },
    ],
  },
  {
    id: "security",
    title: "Bảo mật & Phân quyền",
    description: "An toàn tuyệt đối cho dữ liệu",
    icon: <Shield className="size-6" />,
    features: [
      {
        icon: <Lock className="size-6" />,
        title: "RBAC",
        description:
          "Role-based Access Control: Admin, Manager, Staff với quyền hạn chi tiết.",
      },
      {
        icon: <Shield className="size-6" />,
        title: "Two-Factor Auth (2FA)",
        description:
          "Bảo mật 2 lớp với OTP qua email/SMS, Google Authenticator.",
      },
      {
        icon: <BarChart3 className="size-6" />,
        title: "Audit Logs",
        description: "Ghi lại mọi hoạt động, kiểm tra ai đã làm gì và khi nào.",
      },
      {
        icon: <Globe className="size-6" />,
        title: "IP Whitelisting",
        description: "Giới hạn truy cập admin chỉ từ các IP được phép.",
      },
    ],
  },
  {
    id: "analytics",
    title: "Analytics & Báo cáo",
    description: "Dữ liệu để đưa ra quyết định",
    icon: <LineChart className="size-6" />,
    features: [
      {
        icon: <LineChart className="size-6" />,
        title: "Real-time Dashboard",
        description:
          "Xem doanh thu, đơn hàng, sản phẩm bán chạy real-time trên dashboard.",
      },
      {
        icon: <BarChart3 className="size-6" />,
        title: "Sales Reports",
        description:
          "Báo cáo doanh số theo ngày/tuần/tháng, so sánh với kỳ trước.",
      },
      {
        icon: <Users className="size-6" />,
        title: "Customer Analytics",
        description:
          "Phân tích khách hàng: LTV, tần suất mua, sản phẩm ưa thích.",
      },
      {
        icon: <Package className="size-6" />,
        title: "Inventory Reports",
        description: "Báo cáo tồn kho, sản phẩm bán chậm, dự báo nhu cầu.",
      },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden selection:bg-accent/30">
      {/* Cinematic Background & Aurora Glow */}
      <div className="absolute top-0 inset-x-0 h-[70vh] bg-cinematic pointer-events-none z-0 opacity-40" />
      <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-(--aurora-blue)/15 rounded-full blur-[150px] animate-pulse-glow z-0 pointer-events-none" />
      <div className="absolute top-[20%] -right-[10%] w-[50vw] h-[50vw] bg-(--aurora-purple)/10 rounded-full blur-[120px] animate-float z-0 pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-32 lg:pt-48 pb-20 overflow-hidden z-10">
        <div className="container mx-auto px-4 lg:px-8">
          <m.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.15 } },
            }}
            className="text-center max-w-4xl mx-auto space-y-8"
          >
            <m.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-premium border border-white/10 text-accent text-[10px] font-black uppercase tracking-[0.3em]"
            >
              <Zap className="size-3" />
              <span>50+ tính năng mạnh mẽ</span>
            </m.div>

            <m.h1
              variants={fadeInUp}
              className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter uppercase leading-none bg-clip-text text-transparent bg-linear-to-b from-white to-white/40"
            >
              <span className="block">Công cụ tối cao</span>
              <span className="font-serif italic font-normal text-muted-foreground/60 block mt-4 normal-case tracking-tight">The Ultimate Commerce Toolkit</span>
            </m.h1>

            <m.p
              variants={fadeInUp}
              className="text-xl md:text-2xl text-muted-foreground/80 font-medium max-w-2xl mx-auto leading-relaxed"
            >
              Từ quản lý kho đồng bộ đến AI chatbot thế hệ mới, Luxe SaaS cung cấp cho bạn một hệ sinh thái hoàn chỉnh để thống trị thị trường.
            </m.p>

            <m.div
              variants={fadeInUp}
              className="flex flex-wrap justify-center gap-6 pt-6"
            >
              <Button size="lg" className="rounded-2xl px-10 h-16 bg-accent text-white font-black uppercase tracking-[0.3em] hover:bg-accent/90 transition-all duration-500 shadow-2xl shadow-accent/20" asChild>
                <Link href="/register">
                  Bắt đầu ngay
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-2xl px-10 h-16 glass-premium border-white/10 text-white font-black uppercase tracking-[0.3em] hover:bg-white/5" asChild>
                <Link href="/demo">Xem demo</Link>
              </Button>
            </m.div>
          </m.div>
        </div>
      </section>

      {/* Feature Categories */}
      {featureCategories.map((category, catIndex) => (
        <section
          key={category.id}
          className={cn("py-16 lg:py-24", catIndex % 2 === 1 && "bg-muted/30")}
        >
          <div className="container mx-auto px-4 lg:px-8">
            {/* Category Header */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-2xl mx-auto mb-12"
            >
              <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-primary/10 text-primary mb-4">
                {category.icon}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                {category.title}
              </h2>
              <p className="text-lg text-muted-foreground">
                {category.description}
              </p>
            </m.div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {category.features.map((feature, index) => (
                <m.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all"
                >
                  <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </m.div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <Headphones className="size-16 mx-auto mb-6 opacity-80" />
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Cần tư vấn thêm?
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-8">
              Đội ngũ của chúng tôi sẵn sàng giải đáp mọi thắc mắc và demo trực
              tiếp cho bạn.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/contact">
                  Liên hệ ngay
                  <ArrowRight className="size-4 ml-2" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <Link href="/pricing">Xem bảng giá</Link>
              </Button>
            </div>
          </m.div>
        </div>
      </section>
    </main>
  );
}
