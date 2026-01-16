"use client";

/**
 * =====================================================================
 * DEMO PAGE - Yêu cầu demo hoặc xem Live Demo Store
 * =====================================================================
 */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { m } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  ExternalLink,
  Play,
  Sparkles,
  Store,
  Users,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

// Demo stores
const demoStores = [
  {
    id: "fashion",
    name: "Fashion Boutique",
    description: "Cửa hàng thời trang với đầy đủ tính năng",
    url: "https://fashion-demo.luxesaas.com",
    image: "/images/demos/fashion.jpg",
    features: ["Product Variants", "Wishlist", "Quick View"],
  },
  {
    id: "electronics",
    name: "Tech Store",
    description: "Cửa hàng điện tử với so sánh sản phẩm",
    url: "https://tech-demo.luxesaas.com",
    image: "/images/demos/electronics.jpg",
    features: ["Comparison", "Reviews", "Specifications"],
  },
  {
    id: "food",
    name: "Gourmet Food",
    description: "Cửa hàng thực phẩm với đặt hàng theo lịch",
    url: "https://food-demo.luxesaas.com",
    image: "/images/demos/food.jpg",
    features: ["Scheduled Delivery", "Subscription Box", "Local Pickup"],
  },
];

// What's included in demo
const demoIncludes = [
  {
    icon: <Store className="size-5" />,
    text: "Truy cập đầy đủ Admin Dashboard",
  },
  { icon: <Users className="size-5" />, text: "Demo 1-on-1 với chuyên gia" },
  { icon: <Video className="size-5" />, text: "15 phút Q&A session" },
  { icon: <Sparkles className="size-5" />, text: "Tư vấn theo nhu cầu riêng" },
];

export default function DemoPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    businessType: "",
    preferredTime: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (isSuccess) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center py-20">
        <m.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="size-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="size-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Yêu cầu đã được gửi!</h1>
          <p className="text-muted-foreground mb-8">
            Đội ngũ của chúng tôi sẽ liên hệ với bạn trong vòng 24 giờ để sắp
            xếp buổi demo.
          </p>
          <div className="space-y-3">
            <Button className="w-full" asChild>
              <Link href="/register">Hoặc bắt đầu ngay miễn phí</Link>
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsSuccess(false)}
            >
              Gửi yêu cầu khác
            </Button>
          </div>
        </m.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-background to-background" />
          <div className="absolute top-0 right-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 lg:px-8">
          <m.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="text-center max-w-3xl mx-auto"
          >
            <m.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
            >
              <Play className="size-4" />
              <span>Xem trước sản phẩm</span>
            </m.div>

            <m.h1
              variants={fadeInUp}
              className="text-4xl md:text-5xl font-bold tracking-tight mb-6"
            >
              Trải nghiệm <span className="text-primary">Luxe SaaS</span> ngay
              hôm nay
            </m.h1>

            <m.p
              variants={fadeInUp}
              className="text-xl text-muted-foreground mb-10"
            >
              Khám phá các cửa hàng demo hoặc đặt lịch để được hướng dẫn chi
              tiết 1-on-1
            </m.p>
          </m.div>
        </div>
      </section>

      {/* Live Demo Stores */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Cửa hàng Demo
            </h2>
            <p className="text-lg text-muted-foreground">
              Truy cập ngay các cửa hàng mẫu để xem tính năng thực tế
            </p>
          </m.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {demoStores.map((store, index) => (
              <m.div
                key={store.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all"
              >
                {/* Preview Image */}
                <div className="aspect-video bg-muted flex items-center justify-center relative overflow-hidden">
                  <Store className="size-12 text-muted-foreground/30" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="secondary" size="sm" asChild>
                      <a
                        href={store.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="size-4 mr-2" />
                        Xem Store
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-1">{store.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {store.description}
                  </p>

                  {/* Features Tags */}
                  <div className="flex flex-wrap gap-2">
                    {store.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Request Demo Form */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 max-w-6xl mx-auto">
            {/* Left: Info */}
            <m.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Calendar className="size-4" />
                Đặt lịch Demo
              </div>

              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Nhận demo cá nhân hóa
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Đội ngũ chuyên gia sẽ hướng dẫn bạn qua tất cả tính năng và trả
                lời mọi thắc mắc.
              </p>

              {/* What's Included */}
              <div className="space-y-4 mb-8">
                <h3 className="font-semibold">Demo bao gồm:</h3>
                {demoIncludes.map((item) => (
                  <div
                    key={item.text}
                    className="flex items-center gap-3 text-muted-foreground"
                  >
                    <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      {item.icon}
                    </div>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Testimonial */}
              <div className="p-6 rounded-2xl bg-muted/50 border border-border">
                <p className="text-muted-foreground italic mb-4">
                  "Buổi demo giúp tôi hiểu rõ platform và quyết định upgrade lên
                  Pro ngay lập tức."
                </p>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/20" />
                  <div>
                    <p className="font-medium text-sm">Trần Văn A</p>
                    <p className="text-xs text-muted-foreground">
                      CEO, Fashion Store
                    </p>
                  </div>
                </div>
              </div>
            </m.div>

            {/* Right: Form */}
            <m.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-2xl p-8"
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="email@company.com"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="0912 345 678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Công ty
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="Tên công ty"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Loại hình kinh doanh
                  </label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">Chọn ngành hàng...</option>
                    <option value="fashion">Thời trang</option>
                    <option value="electronics">Điện tử</option>
                    <option value="food">Thực phẩm</option>
                    <option value="beauty">Làm đẹp</option>
                    <option value="home">Nội thất</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Thời gian phù hợp
                  </label>
                  <select
                    name="preferredTime"
                    value={formData.preferredTime}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">Chọn khung giờ...</option>
                    <option value="morning">Sáng (9:00 - 12:00)</option>
                    <option value="afternoon">Chiều (14:00 - 17:00)</option>
                    <option value="evening">Tối (18:00 - 20:00)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Bạn muốn tìm hiểu về tính năng nào?
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    placeholder="VD: Quản lý kho đa chi nhánh, tích hợp VNPay..."
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Đang gửi..."
                  ) : (
                    <>
                      <Calendar className="size-4 mr-2" />
                      Đặt lịch Demo
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Hoặc{" "}
                  <Link
                    href="/register"
                    className="text-primary hover:underline"
                  >
                    bắt đầu ngay miễn phí
                  </Link>{" "}
                  không cần demo
                </p>
              </form>
            </m.div>
          </div>
        </div>
      </section>
    </main>
  );
}
