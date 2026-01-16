"use client";

/**
 * =====================================================================
 * ABOUT PAGE - Giới thiệu về platform
 * =====================================================================
 */

import { Button } from "@/components/ui/button";
import { m } from "framer-motion";
import {
  ArrowRight,
  Award,
  Building2,
  Globe,
  Heart,
  Lightbulb,
  Rocket,
  Shield,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

// Company Stats
const stats = [
  { value: "10,000+", label: "Cửa hàng đang hoạt động" },
  { value: "500M+", label: "Đơn hàng đã xử lý" },
  { value: "50+", label: "Quốc gia" },
  { value: "99.9%", label: "Uptime" },
];

// Company Values
const values = [
  {
    icon: <Heart className="size-6" />,
    title: "Customer First",
    description:
      "Thành công của khách hàng là thước đo thành công của chúng tôi.",
  },
  {
    icon: <Lightbulb className="size-6" />,
    title: "Innovation",
    description: "Không ngừng đổi mới và cải tiến sản phẩm.",
  },
  {
    icon: <Shield className="size-6" />,
    title: "Trust & Security",
    description: "Bảo mật dữ liệu và sự tin tưởng là ưu tiên hàng đầu.",
  },
  {
    icon: <Zap className="size-6" />,
    title: "Simplicity",
    description: "Đơn giản hóa mọi thứ để ai cũng có thể sử dụng.",
  },
];

// Leadership Team
const team = [
  {
    name: "Nguyễn Văn A",
    role: "CEO & Co-founder",
    bio: "15 năm kinh nghiệm trong lĩnh vực E-commerce và SaaS",
    image: "/images/team/ceo.jpg",
  },
  {
    name: "Trần Thị B",
    role: "CTO & Co-founder",
    bio: "Ex-Google, chuyên gia về distributed systems và AI",
    image: "/images/team/cto.jpg",
  },
  {
    name: "Lê Văn C",
    role: "VP of Engineering",
    bio: "Ex-Shopify, 10 năm kinh nghiệm xây dựng platform",
    image: "/images/team/vp-eng.jpg",
  },
  {
    name: "Phạm Thị D",
    role: "VP of Product",
    bio: "Ex-Amazon, chuyên gia UX và product strategy",
    image: "/images/team/vp-product.jpg",
  },
];

// Timeline/Milestones
const milestones = [
  {
    year: "2020",
    title: "Khởi đầu",
    description: "Ra mắt MVP với 100 beta users",
  },
  {
    year: "2021",
    title: "Series A",
    description: "Gọi vốn $5M, đạt 1,000 cửa hàng",
  },
  {
    year: "2022",
    title: "Mở rộng SEA",
    description: "Mở rộng ra Singapore, Thái Lan, Indonesia",
  },
  {
    year: "2023",
    title: "AI Integration",
    description: "Tích hợp AI Chatbot và Smart Recommendations",
  },
  {
    year: "2024",
    title: "Enterprise",
    description: "Ra mắt gói Enterprise, đạt 10,000 cửa hàng",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-background to-background" />
          <div className="absolute top-1/3 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
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
              <Building2 className="size-4" />
              <span>Về chúng tôi</span>
            </m.div>

            <m.h1
              variants={fadeInUp}
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
            >
              Kiến tạo tương lai của{" "}
              <span className="text-primary">thương mại điện tử</span>
            </m.h1>

            <m.p
              variants={fadeInUp}
              className="text-xl text-muted-foreground mb-10"
            >
              Sứ mệnh của chúng tôi là giúp mọi doanh nghiệp, từ startup đến
              enterprise, có thể bán hàng online một cách dễ dàng và hiệu quả
              nhất.
            </m.p>
          </m.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <m.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl lg:text-5xl font-bold mb-2">
                  {stat.value}
                </div>
                <div className="text-primary-foreground/70">{stat.label}</div>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <m.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Target className="size-4" />
                Sứ mệnh
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
                Dân chủ hóa E-commerce
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Chúng tôi tin rằng mọi người đều xứng đáng được tiếp cận công
                nghệ bán hàng hiện đại mà không cần phải là chuyên gia IT hay có
                ngân sách khổng lồ.
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                Luxe SaaS được xây dựng để phá vỡ rào cản này - mang đến một nền
                tảng mạnh mẽ, dễ sử dụng và giá cả phải chăng cho tất cả.
              </p>
              <Button size="lg" asChild>
                <Link href="/features">
                   Khám phá sản phẩm
                  <ArrowRight className="size-4 ml-2" />
                </Link>
              </Button>
            </m.div>

            <m.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Rocket className="size-32 text-primary/30" />
              </div>
            </m.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Giá trị cốt lõi
            </h2>
            <p className="text-lg text-muted-foreground">
              Những nguyên tắc định hướng mọi quyết định của chúng tôi
            </p>
          </m.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <m.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-card border border-border text-center"
              >
                <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  {value.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {value.description}
                </p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Hành trình phát triển
            </h2>
            <p className="text-lg text-muted-foreground">
              Những cột mốc quan trọng trên con đường của chúng tôi
            </p>
          </m.div>

          <div className="max-w-3xl mx-auto">
            {milestones.map((milestone, index) => (
              <m.div
                key={milestone.year}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-6 pb-10 relative"
              >
                {/* Timeline Line */}
                {index < milestones.length - 1 && (
                  <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-border" />
                )}

                {/* Year Marker */}
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0 relative z-10">
                  {milestone.year.slice(2)}
                </div>

                {/* Content */}
                <div className="pt-2">
                  <h3 className="font-semibold text-lg">{milestone.title}</h3>
                  <p className="text-muted-foreground">
                    {milestone.description}
                  </p>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Đội ngũ lãnh đạo
            </h2>
            <p className="text-lg text-muted-foreground">
              Những con người tài năng đứng sau Luxe SaaS
            </p>
          </m.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {team.map((member, index) => (
              <m.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="aspect-square rounded-2xl bg-muted mb-4 flex items-center justify-center">
                  <Users className="size-16 text-muted-foreground/30" />
                </div>
                <h3 className="font-semibold">{member.name}</h3>
                <p className="text-sm text-primary font-medium">
                  {member.role}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {member.bio}
                </p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center bg-primary text-primary-foreground rounded-3xl p-12"
          >
            <Sparkles className="size-12 mx-auto mb-6 opacity-80" />
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Sẵn sàng bắt đầu hành trình?
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-8">
              Tham gia cùng hàng ngàn doanh nghiệp đang phát triển với Luxe
              SaaS.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/register">
                  Tạo cửa hàng miễn phí
                  <ArrowRight className="size-4 ml-2" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <Link href="/contact">Liên hệ với chúng tôi</Link>
              </Button>
            </div>
          </m.div>
        </div>
      </section>
    </main>
  );
}
