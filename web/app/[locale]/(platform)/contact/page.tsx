"use client";

/**
 * =====================================================================
 * CONTACT PAGE - Trang liên hệ
 * =====================================================================
 */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { m } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Headphones,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
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
    title: "Email",
    value: "support@luxesaas.com",
    link: "mailto:support@luxesaas.com",
    description: "Phản hồi trong 24 giờ",
  },
  {
    icon: <Phone className="size-6" />,
    title: "Hotline",
    value: "1900 1234 56",
    link: "tel:19001234",
    description: "8:00 - 18:00, T2-T7",
  },
  {
    icon: <MessageSquare className="size-6" />,
    title: "Live Chat",
    value: "Chat ngay",
    link: "#",
    description: "Hỗ trợ nhanh 24/7",
  },
  {
    icon: <MapPin className="size-6" />,
    title: "Văn phòng",
    value: "123 Nguyễn Văn Linh, Q.7",
    link: "#",
    description: "TP. Hồ Chí Minh",
  },
];

const departments = [
  {
    value: "sales",
    label: "Tư vấn mua hàng",
    description: "Demo, báo giá, enterprise",
  },
  {
    value: "support",
    label: "Hỗ trợ kỹ thuật",
    description: "Sự cố, tính năng, API",
  },
  {
    value: "billing",
    label: "Thanh toán & Hóa đơn",
    description: "Subscription, invoice",
  },
  {
    value: "partnership",
    label: "Hợp tác kinh doanh",
    description: "Agency, affiliate, reseller",
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    department: "sales",
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
      <main className="min-h-screen bg-background flex items-center justify-center py-20">
        <m.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="size-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="size-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Gửi thành công!</h1>
          <p className="text-muted-foreground mb-8">
            Cảm ơn bạn đã liên hệ. Đội ngũ của chúng tôi sẽ phản hồi trong vòng
            24 giờ làm việc.
          </p>
          <Button onClick={() => setIsSuccess(false)}>Gửi tin nhắn khác</Button>
        </m.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background relative overflow-hidden selection:bg-accent/30">
      {/* Cinematic Background & Aurora Glow */}
      <div className="absolute top-0 inset-x-0 h-[70vh] bg-cinematic pointer-events-none z-0 opacity-40" />
      <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-(--aurora-blue)/15 rounded-full blur-[150px] animate-pulse-glow z-0 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-(--aurora-purple)/10 rounded-full blur-[120px] animate-float z-0 pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-32 lg:pt-48 pb-20 overflow-hidden z-10">
        <div className="container mx-auto px-4 lg:px-8">
          <m.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
            className="text-center max-w-4xl mx-auto space-y-8"
          >
            <m.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-premium border border-white/10 text-accent text-[10px] font-black uppercase tracking-[0.3em]"
            >
              <Headphones className="size-3" />
              <span>Đội ngũ hỗ trợ sẵn sàng</span>
            </m.div>

            <m.h1
              variants={fadeInUp}
              className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter uppercase leading-none bg-clip-text text-transparent bg-linear-to-b from-white to-white/40"
            >
              <span className="block">Chúng tôi ở đây</span>
              <span className="font-serif italic font-normal text-muted-foreground/60 block mt-4 normal-case tracking-tight">Support & Assistance</span>
            </m.h1>

            <m.p
              variants={fadeInUp}
              className="text-xl md:text-2xl text-muted-foreground/80 font-medium max-w-2xl mx-auto leading-relaxed"
            >
              Có câu hỏi? Muốn demo? Cần hỗ trợ kỹ thuật? <br className="hidden md:block" /> Chúng tôi luôn sẵn sàng đồng hành cùng sự phát triển của bạn.
            </m.p>
          </m.div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-8">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {contactInfo.map((item, index) => (
              <m.a
                key={item.title}
                href={item.link}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all"
              >
                <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {item.icon}
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-primary font-medium mb-1">{item.value}</p>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </m.a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 relative z-10">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 max-w-7xl mx-auto">
            {/* Left: Info */}
            <m.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-10"
            >
              <div className="space-y-6">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight uppercase">
                   Gửi tin nhắn <br /> cho chúng tôi
                </h2>
                <p className="text-xl text-muted-foreground/70 font-medium max-w-md leading-relaxed">
                  Điền form bên dưới và đội ngũ của chúng tôi sẽ liên hệ lại trong thời gian sớm nhất.
                </p>
              </div>

              {/* Response Time */}
              <div className="flex items-center gap-5 p-6 rounded-3xl glass-premium border border-white/5 shadow-2xl">
                <div className="size-14 rounded-2xl bg-accent/10 flex items-center justify-center">
                  <Clock className="size-6 text-accent" />
                </div>
                <div>
                  <p className="font-bold uppercase tracking-tight">Thời gian phản hồi</p>
                  <p className="text-sm text-muted-foreground/60 font-medium">
                    Thường trong 2-4 giờ làm việc
                  </p>
                </div>
              </div>

              {/* Department Selection */}
              <div className="space-y-4">
                <p className="font-black text-[10px] uppercase tracking-[0.4em] text-muted-foreground/40 mb-6">Chọn bộ phận:</p>
                <div className="space-y-3">
                  {departments.map((dept) => (
                    <label
                      key={dept.value}
                      className={cn(
                        "flex items-center gap-4 p-5 rounded-3xl border transition-all duration-500 cursor-pointer group shadow-2xl",
                        formData.department === dept.value
                          ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                          : "border-white/5 bg-white/2 hover:bg-white/5"
                      )}
                    >
                      <input
                        type="radio"
                        name="department"
                        value={dept.value}
                        checked={formData.department === dept.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div
                        className={cn(
                          "size-6 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                          formData.department === dept.value
                            ? "border-accent scale-110"
                            : "border-muted-foreground/20"
                        )}
                      >
                        {formData.department === dept.value && (
                          <div className="size-3 rounded-full bg-accent shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]" />
                        )}
                      </div>
                      <div>
                        <p className={cn("font-bold uppercase tracking-tight transition-colors duration-500", formData.department === dept.value ? "text-white" : "text-muted-foreground/80")}>{dept.label}</p>
                        <p className="text-sm text-muted-foreground/40 font-medium">
                          {dept.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </m.div>

            {/* Right: Form */}
            <m.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="p-10 md:p-14 rounded-4xl glass-premium border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.2)]">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid sm:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="font-black text-[10px] uppercase tracking-[0.4em] text-muted-foreground/40">
                         Họ và tên
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-6 py-4 rounded-2xl glass-premium border-white/5 bg-white/2 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-300 placeholder:text-muted-foreground/20 font-medium"
                        placeholder="Nguyễn Văn A"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="font-black text-[10px] uppercase tracking-[0.4em] text-muted-foreground/40">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-6 py-4 rounded-2xl glass-premium border-white/5 bg-white/2 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-300 placeholder:text-muted-foreground/20 font-medium"
                        placeholder="email@company.com"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="font-black text-[10px] uppercase tracking-[0.4em] text-muted-foreground/40">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-6 py-4 rounded-2xl glass-premium border-white/5 bg-white/2 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-300 placeholder:text-muted-foreground/20 font-medium"
                        placeholder="0912 345 678"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="font-black text-[10px] uppercase tracking-[0.4em] text-muted-foreground/40">
                         Công ty
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="w-full px-6 py-4 rounded-2xl glass-premium border-white/5 bg-white/2 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-300 placeholder:text-muted-foreground/20 font-medium"
                        placeholder="Tên công ty"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="font-black text-[10px] uppercase tracking-[0.4em] text-muted-foreground/40">
                      Nội dung tin nhắn
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="w-full px-6 py-4 rounded-2xl glass-premium border-white/5 bg-white/2 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-300 placeholder:text-muted-foreground/20 font-medium resize-none"
                      placeholder="Mô tả chi tiết nhu cầu của bạn..."
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-16 rounded-2xl bg-accent text-white font-black uppercase tracking-[0.3em] hover:bg-accent/90 transition-all duration-500 shadow-2xl shadow-accent/20 flex items-center justify-center gap-3 disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      "Đang gửi..."
                    ) : (
                      <>
                        <Send className="size-4" />
                        <span>Gửi tin nhắn</span>
                      </>
                    )}
                  </Button>

                  <p className="text-[10px] text-muted-foreground/40 text-center font-black uppercase tracking-[0.2em]">
                    Bằng việc gửi form, bạn đồng ý với{" "}
                    <Link href="/privacy" className="text-accent hover:underline">
                      Chính sách bảo mật
                    </Link>
                  </p>
                </form>
              </div>
            </m.div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Ghé thăm văn phòng
            </h2>
            <p className="text-lg text-muted-foreground">
              123 Nguyễn Văn Linh, Phường Tân Phú, Quận 7, TP. Hồ Chí Minh
            </p>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto rounded-2xl overflow-hidden border border-border"
          >
            <iframe
              src="https://maps.google.com/maps?q=10.7328,106.7213&z=15&output=embed"
              className="w-full h-96"
              loading="lazy"
              title="Office Location"
            />
          </m.div>
        </div>
      </section>
    </main>
  );
}
