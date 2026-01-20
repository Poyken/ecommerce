"use client";

import { Button } from "@/components/ui/button";
import { m } from "framer-motion";
import {
  ArrowRight,
  Gem,
  Heart,
  Leaf,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import Image from "next/image";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

// Furniture Store Stats
const stats = [
  { value: "5000+", label: "Sản phẩm nội thất" },
  { value: "50k+", label: "Khách hàng hài lòng" },
  { value: "24h", label: "Giao hàng nhanh" },
  { value: "10Y", label: "Bảo hành khung gỗ" },
];

// Furniture Store Values
const values = [
  {
    icon: <Gem className="size-6" />,
    title: "Premium Materials",
    description:
      "Sử dụng gỗ tự nhiên, da thật và vải nhập khẩu cao cấp nhất.",
  },
  {
    icon: <Leaf className="size-6" />,
    title: "Sustainability",
    description: "Cam kết nguồn nguyên liệu bền vững và thân thiện môi trường.",
  },
  {
    icon: <ShieldCheck className="size-6" />,
    title: "Craftsmanship",
    description: "Được chế tác thủ công bởi những nghệ nhân lành nghề.",
  },
  {
    icon: <Heart className="size-6" />,
    title: "Customer Love",
    description: "Dịch vụ tận tâm, đổi trả miễn phí trong 30 ngày.",
  },
];

// Store Milestones with timeline
const milestones = [
  {
    year: "2015",
    title: "Khởi nguồn",
    description: "Cửa hàng đầu tiên tại Quận 1, TP.HCM",
  },
  {
    year: "2018",
    title: "Mở rộng quy mô",
    description: "Ra mắt xưởng sản xuất riêng 5000m2",
  },
  {
    year: "2020",
    title: "Go Online",
    description: "Ra mắt website E-commerce phục vụ toàn quốc",
  },
  {
    year: "2022",
    title: "Quốc tế hóa",
    description: "Xuất khẩu lô hàng đầu tiên sang Châu Âu",
  },
  {
    year: "2024",
    title: "Smart Living",
    description: "Ra mắt dòng sản phẩm nội thất thông minh",
  },
];

export default function ShopAboutPage() {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden transition-colors duration-500 pb-24 font-sans text-foreground">
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
              <ShoppingBag className="size-3" />
              <span>Brand Story</span>
            </m.div>

            <m.h1
              variants={fadeInUp}
              className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter uppercase leading-none bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/40 mb-10"
            >
              Architecting <br />
              <span className="font-serif italic font-normal text-muted-foreground/60 block mt-4 normal-case tracking-tight">Luxury Spaces</span>
            </m.h1>

            <m.p
              variants={fadeInUp}
              className="text-xl md:text-2xl text-muted-foreground/80 font-medium max-w-2xl leading-relaxed"
            >
              We don't just sell furniture. We bring soul to your home through exquisite and unique designs.
            </m.p>
          </m.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-foreground text-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
            {stats.map((stat, index) => (
              <m.div
                key={stat.label}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="text-center group"
              >
                <div className="text-5xl lg:text-6xl font-bold mb-3 bg-linear-to-b from-background to-background/60 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-500">
                  {stat.value}
                </div>
                <div className="text-white/60 font-medium tracking-wide uppercase text-sm">{stat.label}</div>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <m.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold mb-6">
                <Sparkles className="size-4" />
                Tinh hoa nghệ thuật
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 leading-tight">
                Đưa thiên nhiên vào <br/> không gian sống
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Mỗi sản phẩm tại cửa hàng là kết tinh của sự tỉ mỉ và tình yêu với cái đẹp. Chúng tôi tin rằng một không gian sống đẹp sẽ nuôi dưỡng tâm hồn đẹp.
              </p>
              <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                Từ những thớ gỗ sồi tự nhiên đến những đường may da thủ công, mọi chi tiết đều được chăm chút để đạt đến sự hoàn hảo.
              </p>
              <Button size="lg" className="rounded-full px-8 h-12 text-base font-semibold shadow-lg shadow-primary/20" asChild>
                <Link href="/shop">
                   Khám phá bộ sưu tập
                  <ArrowRight className="size-4 ml-2" />
                </Link>
              </Button>
            </m.div>

            <m.div
              initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="relative"
            >
              <div className="aspect-4/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                 <div className="w-full h-full bg-linear-to-br from-neutral-200 to-neutral-100 flex items-center justify-center relative">
                    {/* Ideally replace with a real image */}
                    <div className="absolute inset-0 bg-neutral-200 animate-pulse" /> 
                    <Image 
                      src="/images/home/promo-living.jpg" 
                      alt="Living Room"
                      fill
                      className="object-cover w-full h-full hover:scale-105 transition-transform duration-1000"
                    />
                 </div>
              </div>
              {/* Floating Badge */}
              <div className="absolute -bottom-10 -left-10 bg-background p-6 rounded-3xl shadow-xl border border-border/50 max-w-[200px]">
                <div className="flex items-center gap-1 mb-2">
                    {[1,2,3,4,5].map(i => <Sparkles key={i} className="size-4 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="font-bold text-lg leading-tight">"Nội thất tinh tế nhất tôi từng thấy!"</p>
              </div>
            </m.div>
          </div>
        </div>
      </section>

      {/* Values Section Grid */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <m.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
              Giá trị khác biệt
            </h2>
            <p className="text-xl text-muted-foreground">
              Điều gì khiến nội thất của chúng tôi trở thành lựa chọn số 1?
            </p>
          </m.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <m.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group p-8 rounded-3xl bg-background border border-border/50 hover:border-primary/50 shadow-xs hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <m.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
              Hành trình phát triển
            </h2>
          </m.div>

          <div className="max-w-4xl mx-auto">
            {milestones.map((milestone, index) => (
              <m.div
                key={milestone.year}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="flex gap-8 pb-16 relative"
              >
                {/* Connecting Line */}
                {index < milestones.length - 1 && (
                  <div className="absolute left-[27px] top-16 bottom-0 w-0.5 bg-linear-to-b from-primary/50 to-transparent" />
                )}

                {/* Year Bubble */}
                <div className="size-14 rounded-full bg-background border-4 border-primary/20 flex items-center justify-center font-bold text-primary shrink-0 z-10 shadow-lg">
                  {milestone.year.slice(2)}
                </div>

                {/* Content */}
                <div className="pt-2 bg-muted/20 p-6 rounded-2xl w-full hover:bg-muted/40 transition-colors">
                  <h3 className="font-bold text-lg mb-1">{milestone.title}</h3>
                  <p className="text-muted-foreground">
                    {milestone.description}
                  </p>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-[3rem] bg-primary text-primary-foreground p-12 md:p-24 text-center"
          >
             
            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                <Sparkles className="size-16 mx-auto opacity-80" />
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
                Sẵn sàng làm mới không gian?
                </h2>
                <p className="text-xl md:text-2xl opacity-90 font-light">
                Khám phá bộ sưu tập mới nhất và nhận ưu đãi 10% cho đơn hàng đầu tiên.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                <Button size="lg" variant="secondary" className="h-14 px-8 rounded-full text-lg font-semibold" asChild>
                    <Link href="/shop">
                    Mua sắm ngay
                    <ArrowRight className="size-5 ml-2" />
                    </Link>
                </Button>
                <Button
                    size="lg"
                    variant="outline"
                    className="h-14 px-8 rounded-full text-lg font-semibold bg-transparent border-white/30 hover:bg-white/10 text-white"
                    asChild
                >
                    <Link href="/shop-contact">Liên hệ tư vấn</Link>
                </Button>
                </div>
            </div>
          </m.div>
        </div>
      </section>
    </main>
  );
}
