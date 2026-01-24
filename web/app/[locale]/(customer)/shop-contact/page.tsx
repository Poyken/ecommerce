"use client";

/**
 * =====================================================================
 * SHOP CONTACT PAGE - Trang liên hệ cửa hàng (Premium UI)
 * =====================================================================
 */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { m } from "framer-motion";
import {
  Clock,
  Headphones,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  Sparkles,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { useState } from "react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const contactInfo = [
  {
    icon: <Mail className="size-6" />,
    title: "Email Hỗ Trợ",
    value: "support@shop.com",
    link: "mailto:support@shop.com",
    description: "Giải đáp mọi thắc mắc 24/7",
  },
  {
    icon: <Phone className="size-6" />,
    title: "Hotline Tư Vấn",
    value: "1900 1234 56",
    link: "tel:19001234",
    description: "8:00 - 21:00, Tất cả các ngày",
  },
  {
    icon: <MessageSquare className="size-6" />,
    title: "Live Chat",
    value: "Chat Với Chuyên Gia",
    link: "#",
    description: "Tư vấn thiết kế nội thất",
  },
  {
    icon: <MapPin className="size-6" />,
    title: "Showroom",
    value: "123 Nguyễn Văn Linh, Q.7",
    link: "#",
    description: "Trải nghiệm sản phẩm thực tế",
  },
];

const topics = [
  {
    value: "consultation",
    label: "Tư vấn thiết kế",
    description: "Đặt lịch hẹn với KTS",
  },
  {
    value: "product",
    label: "Thông tin sản phẩm",
    description: "Chất liệu, kích thước",
  },
  {
    value: "order",
    label: "Tra cứu đơn hàng",
    description: "Vận chuyển, lắp đặt",
  },
  {
    value: "warranty",
    label: "Bảo hành & Bảo trì",
    description: "Xử lý sự cố, đổi trả",
  },
];

export default function ShopContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    topic: "consultation",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
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
      <main className="min-h-screen bg-background flex items-center justify-center py-20 relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        
        <m.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
            <Sparkles className="size-12 text-primary animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Gửi thành công!</h1>
          <p className="text-muted-foreground mb-8 text-lg">
            Cảm ơn bạn đã liên hệ. Đội ngũ chuyên gia của chúng tôi sẽ phản hồi trong thời gian sớm nhất.
          </p>
          <Button onClick={() => setIsSuccess(false)} size="lg" className="rounded-full px-8">Gửi tin nhắn khác</Button>
        </m.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent relative overflow-hidden transition-colors duration-500 pb-24 font-sans text-foreground">
      {/* Cinematic Background & Aurora Glow */}
      <div className="fixed inset-0 bg-cinematic pointer-events-none z-0 opacity-40" />
      <div className="fixed top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-(--aurora-blue)/15 rounded-full blur-[150px] animate-pulse-glow z-0 pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-(--aurora-purple)/15 rounded-full blur-[150px] animate-float z-0 pointer-events-none" />

      {/* Hero Section */}
      <section className="relative py-32 lg:py-48 overflow-hidden z-10">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          <m.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="text-left"
          >
            <m.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-premium border border-white/10 text-accent text-[10px] font-black uppercase tracking-[0.3em] mb-8"
            >
              <Headphones className="size-3" />
              <span>Conciege Service</span>
            </m.div>

            <m.h1
              variants={fadeInUp}
              className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter uppercase leading-none bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/40 mb-10"
            >
              Contact <br />
              <span className="font-serif italic font-normal text-muted-foreground/60 block mt-4 normal-case tracking-tight">Luxury Support</span>
            </m.h1>

            <m.p
              variants={fadeInUp}
              className="text-xl md:text-2xl text-muted-foreground/80 font-medium max-w-2xl leading-relaxed"
            >
              We are always ready to listen, advise and accompany you in creating your dream living space.
            </m.p>
          </m.div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {contactInfo.map((item, index) => (
              <m.a
                key={item.title}
                href={item.link}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group p-8 rounded-3xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 relative z-10">
                  {item.icon}
                </div>
                <div className="relative z-10">
                    <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-primary font-semibold mb-2 text-lg">{item.value}</p>
                    <p className="text-sm text-muted-foreground">
                    {item.description}
                    </p>
                </div>
              </m.a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 max-w-7xl mx-auto items-start">
            {/* Left: Info */}
            <m.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8">
                Gửi yêu cầu hỗ trợ
              </h2>
              <p className="text-xl text-muted-foreground mb-12 font-light leading-relaxed">
                Để lại thông tin, đội ngũ chuyên gia của chúng tôi sẽ liên hệ lại để tư vấn chi tiết cho bạn.
              </p>

              {/* Response Time */}
              <div className="space-y-6 mb-12">
                <div className="flex items-center gap-6 p-6 rounded-3xl bg-muted/30 border border-border/50">
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Clock className="size-6" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">Thời gian phản hồi nhanh</p>
                    <p className="text-muted-foreground">
                      Trung bình trong vòng 30 phút (giờ hành chính)
                    </p>
                  </div>
                </div>
              </div>

              {/* Topic Selection */}
              <div className="space-y-4">
                <p className="font-bold text-lg mb-4">Bạn quan tâm vấn đề gì?</p>
                {topics.map((item) => (
                  <label
                    key={item.value}
                    className={cn(
                      "flex items-center gap-4 p-5 rounded-2xl border cursor-pointer transition-all duration-300",
                      formData.topic === item.value
                        ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                        : "border-border/50 hover:border-primary/30"
                    )}
                  >
                  <input
                      type="radio"
                      name="topic"
                      value={item.value}
                      checked={formData.topic === item.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div
                      className={cn(
                        "size-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                        formData.topic === item.value
                          ? "border-primary"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {formData.topic === item.value && (
                        <div className="size-3 rounded-full bg-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </m.div>

            {/* Right: Form */}
            <m.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-card p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-border/50"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold ml-1">
                       Họ và tên
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-5 py-4 rounded-xl border border-border/50 bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-background transition-all"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold ml-1">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-5 py-4 rounded-xl border border-border/50 bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-background transition-all"
                      placeholder="0912..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold ml-1">
                      Email liên hệ
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-5 py-4 rounded-xl border border-border/50 bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-background transition-all"
                      placeholder="email@example.com"
                    />
                  </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold ml-1">
                    Nội dung chi tiết
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-5 py-4 rounded-xl border border-border/50 bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-background transition-all resize-none"
                    placeholder="Vui lòng mô tả vấn đề hoặc yêu cầu của bạn..."
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-14 rounded-full text-lg font-semibold shadow-lg shadow-primary/25"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Đang gửi..."
                  ) : (
                    <>
                      <Send className="size-5 mr-2" />
                      Gửi yêu cầu ngay
                    </>
                  )}
                </Button>
              </form>
            </m.div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <m.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
              Ghé thăm Showroom
            </h2>
            <p className="text-xl text-muted-foreground font-light">
              Trải nghiệm thực tế không gian nội thất sang trọng tại hệ thống showroom của chúng tôi.
            </p>
          </m.div>

          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto rounded-[3rem] overflow-hidden border border-border shadow-2xl h-[500px] relative group"
          >
            <div className="absolute inset-0 bg-primary/10 z-10 pointer-events-none group-hover:bg-transparent transition-colors duration-500" />
            <iframe
              src="https://maps.google.com/maps?q=10.7328,106.7213&z=15&output=embed"
              className="w-full h-full grayscale group-hover:grayscale-0 transition-all duration-700"
              loading="lazy"
              title="Office Location"
            />
          </m.div>
        </div>
      </section>
    </main>
  );
}
