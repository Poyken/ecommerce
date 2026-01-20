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
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-background to-background" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
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
              <Headphones className="size-4" />
              <span>Đội ngũ hỗ trợ sẵn sàng</span>
            </m.div>

            <m.h1
              variants={fadeInUp}
              className="text-4xl md:text-5xl font-bold tracking-tight mb-6"
            >
              Chúng tôi ở đây để <span className="text-primary">giúp bạn</span>
            </m.h1>

            <m.p
              variants={fadeInUp}
              className="text-xl text-muted-foreground"
            >
              Có câu hỏi? Muốn demo? Cần hỗ trợ kỹ thuật? Liên hệ ngay!
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

      {/* Contact Form Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 max-w-6xl mx-auto">
            {/* Left: Info */}
            <m.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                Gửi tin nhắn cho chúng tôi
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Điền form bên dưới và đội ngũ của chúng tôi sẽ liên hệ lại trong
                thời gian sớm nhất.
              </p>

              {/* Response Time */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                  <Clock className="size-5 text-primary" />
                  <div>
                    <p className="font-medium">Thời gian phản hồi</p>
                    <p className="text-sm text-muted-foreground">
                      Thường trong 2-4 giờ làm việc
                    </p>
                  </div>
                </div>
              </div>

              {/* Department Selection */}
              <div className="space-y-3">
                <p className="font-medium mb-3">Chọn bộ phận:</p>
                {departments.map((dept) => (
                  <label
                    key={dept.value}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                      formData.department === dept.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
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
                        "size-5 rounded-full border-2 flex items-center justify-center",
                        formData.department === dept.value
                          ? "border-primary"
                          : "border-muted-foreground"
                      )}
                    >
                      {formData.department === dept.value && (
                        <div className="size-2.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{dept.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {dept.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </m.div>

            {/* Right: Form */}
            <m.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Họ và tên <span className="text-destructive">*</span>
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
                      Email <span className="text-destructive">*</span>
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
                    Nội dung <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    placeholder="Mô tả chi tiết nhu cầu của bạn..."
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
                      <Send className="size-4 mr-2" />
                      Gửi tin nhắn
                    </>
                  )}
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  Bằng việc gửi form, bạn đồng ý với{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Chính sách bảo mật
                  </Link>{" "}
                  của chúng tôi.
                </p>
              </form>
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
