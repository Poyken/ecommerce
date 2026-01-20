import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Luxe SaaS | Nền tảng Thương mại điện tử Đa kênh & B2B",
  description:
    "Tạo cửa hàng trực tuyến của riêng bạn chỉ trong 30 giây. Tích hợp sẵn AI, Quản lý đa kho và Bán buôn B2B. Giải pháp Multi-tenant SaaS hoàn chỉnh.",
  openGraph: {
    title: "Luxe SaaS | Nền tảng E-Commerce Multi-tenant",
    description:
      "Tạo cửa hàng trực tuyến của riêng bạn chỉ trong 30 giây. Tích hợp sẵn AI, Quản lý đa kho và Bán buôn B2B.",
    type: "website",
    images: ["/og-marketing.jpg"],
  },
};

const navLinks = [
  { href: "/features", label: "Tính năng" },
  { href: "/pricing", label: "Bảng giá" },
  { href: "/demo", label: "Demo" },
  { href: "/about", label: "Về chúng tôi" },
  { href: "/contact", label: "Liên hệ" },
];

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Marketing Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/landing" className="flex items-center gap-2">
              <Sparkles className="size-6 text-primary" />
              <span className="font-bold text-xl">Luxe SaaS</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hidden sm:flex"
              >
                <Link href="/login">Đăng nhập</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Bắt đầu miễn phí</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {children}

      {/* Marketing Footer */}
      <footer className="bg-secondary/30 border-t border-border mt-20">
        <div className="container mx-auto px-4 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
            {/* Brand */}
            <div className="lg:col-span-4 space-y-6">
              <Link href="/landing" className="flex items-center gap-2">
                <Sparkles className="size-6 text-primary" />
                <span className="font-bold text-2xl tracking-tight">
                  Luxe SaaS
                </span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                Nền tảng E-commerce Multi-tenant hiện đại, tối ưu hóa cho doanh
                nghiệp Việt Nam vươn tầm quốc tế.
              </p>
              <div className="flex gap-4 pt-2">
                {/* Social icons Placeholder */}
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer">
                  <div className="size-4 bg-primary rounded-xs" />
                </div>
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer">
                  <div className="size-4 bg-primary rounded-xs" />
                </div>
              </div>
            </div>

            {/* Product */}
            <div className="lg:col-span-2 lg:col-start-6">
              <h4 className="font-bold text-xs uppercase tracking-[0.2em] mb-6">
                Sản phẩm
              </h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li>
                  <Link href="/features" className="hover:text-primary transition-colors">
                    Tính năng
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-primary transition-colors">
                    Bảng giá
                  </Link>
                </li>
                <li>
                  <Link href="/demo" className="hover:text-primary transition-colors">
                    Dấu ấn khách hàng
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-primary transition-colors">
                    Đăng ký ngay
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div className="lg:col-span-2">
              <h4 className="font-bold text-xs uppercase tracking-[0.2em] mb-6">
                Công ty
              </h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li>
                  <Link href="/about" className="hover:text-primary transition-colors">
                    Về chúng tôi
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-primary transition-colors">
                    Liên hệ
                  </Link>
                </li>
                <li>
                  <span className="hover:text-primary transition-colors cursor-pointer">
                    Blog công nghệ
                  </span>
                </li>
                <li>
                  <span className="hover:text-primary transition-colors cursor-pointer">
                    Tuyển dụng
                  </span>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div className="lg:col-span-2">
              <h4 className="font-bold text-xs uppercase tracking-[0.2em] mb-6">
                Pháp lý
              </h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li>
                  <span className="hover:text-primary transition-colors cursor-pointer">
                    Điều khoản dịch vụ
                  </span>
                </li>
                <li>
                  <span className="hover:text-primary transition-colors cursor-pointer">
                    Chính sách bảo mật
                  </span>
                </li>
                <li>
                  <span className="hover:text-primary transition-colors cursor-pointer">
                    Cookie Policy
                  </span>
                </li>
                <li>
                  <span className="hover:text-primary transition-colors cursor-pointer">
                    SLA Cam kết 99.9%
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
              © 2026 Luxe SaaS. All rights reserved.
            </p>
            <div className="flex items-center gap-8">
              <span className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer font-bold uppercase tracking-widest">
                Tiếng Việt
              </span>
              <span className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer font-bold uppercase tracking-widest">
                English
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
