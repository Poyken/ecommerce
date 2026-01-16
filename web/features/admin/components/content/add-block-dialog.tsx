"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  ImageIcon,
  LayoutGrid,
  MousePointerClick,
  Sparkles,
  Type,
  Users,
  Clock,
  Table2,
  PanelTop,
  ChevronDown,
  Building2,
  Newspaper,
  Mail,
  MapPin,
  Share2,
  Code2,
  Minus,
  Columns,
  Grid3X3,
  ListOrdered,
  Tv,
  LayoutPanelTop,
  Megaphone,
  Timer,
  Images,
  Zap,
  CreditCard,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";

/**
 * =====================================================================
 * ADD BLOCK DIALOG - Dialog thêm blocks với categories
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. BLOCK CATEGORIES:
 *    - Blocks được chia thành các nhóm để dễ tìm kiếm
 *    - Mỗi category có label, description và icon riêng
 *
 * 2. BLOCK TYPES:
 *    - type: Định danh duy nhất (dùng trong BlockRenderer)
 *    - category: Nhóm mà block thuộc về
 *    - defaultProps: Dữ liệu mẫu ban đầu
 *
 * =====================================================================
 */

export type BlockCategory =
  | "layout"
  | "hero-media"
  | "content"
  | "commerce"
  | "engagement"
  | "advanced";

export interface BlockCategoryInfo {
  id: BlockCategory;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export interface BlockType {
  type: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: BlockCategory;
  defaultProps: Record<string, any>;
}

export const BLOCK_CATEGORIES: BlockCategoryInfo[] = [
  {
    id: "layout",
    label: "Layout",
    description: "Cấu trúc và bố cục trang",
    icon: <LayoutPanelTop className="size-5" />,
  },
  {
    id: "hero-media",
    label: "Hero & Media",
    description: "Banner, video và gallery",
    icon: <Tv className="size-5" />,
  },
  {
    id: "content",
    label: "Nội dung",
    description: "Text, timeline và team",
    icon: <Type className="size-5" />,
  },
  {
    id: "commerce",
    label: "Commerce",
    description: "Sản phẩm và bán hàng",
    icon: <CreditCard className="size-5" />,
  },
  {
    id: "engagement",
    label: "Tương tác",
    description: "Form, FAQ và testimonials",
    icon: <MessageSquare className="size-5" />,
  },
  {
    id: "advanced",
    label: "Nâng cao",
    description: "Embed, map và social",
    icon: <Code2 className="size-5" />,
  },
];

export const AVAILABLE_BLOCKS: BlockType[] = [
  // =====================================================================
  // LAYOUT BLOCKS
  // =====================================================================
  {
    type: "FlexLayout",
    label: "Flex Layout",
    description: "Multi-column layout with customizable content",
    icon: <LayoutPanelTop className="size-6" />,
    category: "layout",
    defaultProps: {
      title: "Elevate Your Perspective",
      subtitle: "Custom content arrangements for a bespoke digital experience",
      layout: "1-1",
      gap: "medium",
      items: [
        {
          title: "Modern Craftsmanship",
          description: "Details that define excellence.",
          image: "/images/home/promo-furniture.jpg",
          theme: "dark",
          alignment: "left",
        },
        {
          title: "Our Philosophy",
          description: "Beauty and functionality in harmony.",
          icon: "Sparkles",
          theme: "glass",
          alignment: "center",
        },
      ],
    },
  },
  {
    type: "Divider",
    label: "Divider / Spacer",
    description: "Điều chỉnh khoảng cách giữa các sections",
    icon: <Minus className="size-6" />,
    category: "layout",
    defaultProps: {
      height: "md",
      showLine: true,
      lineStyle: "solid",
      maxWidth: "container",
    },
  },
  {
    type: "Tabs",
    label: "Tabs",
    description: "Nội dung dạng tabs có thể chuyển đổi",
    icon: <PanelTop className="size-6" />,
    category: "layout",
    defaultProps: {
      title: "",
      tabs: [
        {
          id: "tab1",
          label: "Tab 1",
          icon: "Sparkles",
          content: "Nội dung tab 1",
        },
        { id: "tab2", label: "Tab 2", icon: "Star", content: "Nội dung tab 2" },
      ],
      variant: "underline",
      alignment: "center",
    },
  },
  {
    type: "Accordion",
    label: "Accordion",
    description: "Nội dung mở rộng dạng accordion",
    icon: <ChevronDown className="size-6" />,
    category: "layout",
    defaultProps: {
      title: "Câu hỏi thường gặp",
      items: [
        {
          id: "1",
          title: "Câu hỏi 1?",
          content: "Trả lời 1",
          icon: "HelpCircle",
        },
        {
          id: "2",
          title: "Câu hỏi 2?",
          content: "Trả lời 2",
          icon: "HelpCircle",
        },
      ],
      allowMultipleOpen: false,
      variant: "bordered",
    },
  },
  {
    type: "Header",
    label: "Sticky Header",
    description: "Configurable site header with navigation",
    icon: <LayoutGrid className="size-6" />,
    category: "layout",
    defaultProps: {
      transparent: false,
      fullWidth: false,
      customHeight: 80,
      links: [
        { label: "Home", href: "/" },
        { label: "Shop", href: "/shop" },
        { label: "About", href: "/about" },
      ],
    },
  },
  {
    type: "Footer",
    label: "Site Footer",
    description: "Global footer with social links",
    icon: <LayoutGrid className="size-6" />,
    category: "layout",
    defaultProps: {
      companyName: "Luxe Premium",
      description: "Defining the future of luxury living.",
      socialLinks: [
        { platform: "Instagram", url: "#" },
        { platform: "Facebook", url: "#" },
      ],
    },
  },

  // =====================================================================
  // HERO & MEDIA BLOCKS
  // =====================================================================
  {
    type: "Hero",
    label: "Hero Section",
    description: "Large banner with title and CTA",
    icon: <Sparkles className="size-6" />,
    category: "hero-media",
    defaultProps: {
      title: "Redefining Luxury Living",
      subtitle:
        "Experience the epitome of elegance with our curated selection.",
      badge: "New Collection",
      ctaText: "Shop Collection",
      ctaLink: "/shop",
      layout: "split",
      height: "screen",
      bgImage: "/images/home/hero-luxury.jpg",
    },
  },
  {
    type: "VideoHero",
    label: "Video Hero",
    description: "High-impact video banner",
    icon: <Tv className="size-6" />,
    category: "hero-media",
    defaultProps: {
      title: "Pure Elegance in Motion",
      subtitle: "Experience luxury redefined through cinematic storytelling.",
      videoUrl:
        "https://cdn.pixabay.com/video/2021/04/12/70860-537446549_tiny.mp4",
      overlayOpacity: 0.5,
      height: "large",
    },
  },
  {
    type: "Banner",
    label: "Banner",
    description: "Image banner with text overlay",
    icon: <ImageIcon className="size-6" />,
    category: "hero-media",
    defaultProps: {
      title: "The Summer Collection",
      subtitle: "Embrace the warmth with our finest outdoor arrangements",
      ctaText: "Explore Now",
      ctaLink: "/shop",
    },
  },
  {
    type: "PromoBanner",
    label: "Digital Promo Banner",
    description: "High-impact promo banner with Aurora & Glass effects",
    icon: <Megaphone className="size-6" />,
    category: "hero-media",
    defaultProps: {
      title: "Midnight Edition",
      subtitle: "Exclusive drops available only for 24 hours.",
      discountText: "70% OFF SITEWIDE",
      auroraVariant: "cinematic",
      ctaText: "Join the Drop",
      ctaLink: "/shop",
    },
  },
  {
    type: "Gallery",
    label: "Image Gallery",
    description: "Masonry-style image grid with lightbox",
    icon: <Images className="size-6" />,
    category: "hero-media",
    defaultProps: {
      title: "Our Finest Creations",
      subtitle: "Explore the artistry behind our collections",
      images: [
        {
          src: "/images/home/hero-luxury.jpg",
          alt: "Gallery 1",
          title: "Velvet Elegance",
        },
        {
          src: "/images/home/promo-furniture.jpg",
          alt: "Gallery 2",
          title: "Modernist Form",
        },
      ],
    },
  },
  {
    type: "PromoGrid",
    label: "Promo Grid",
    description: "Two-column promo banner grid",
    icon: <Grid3X3 className="size-6" />,
    category: "hero-media",
    defaultProps: {},
  },
  {
    type: "Marquee",
    label: "Marquee",
    description: "Infinite scrolling text banner",
    icon: <Zap className="size-6" />,
    category: "hero-media",
    defaultProps: {
      items: ["PREMIUM QUALITY", "GLOBAL SHIPPING", "CONCIERGE SERVICE"],
      speed: 30,
      direction: "left",
    },
  },

  // =====================================================================
  // CONTENT BLOCKS
  // =====================================================================
  {
    type: "TextBlock",
    label: "Text Block",
    description: "Rich text content block",
    icon: <Type className="size-6" />,
    category: "content",
    defaultProps: {
      title: "Our Philosophy",
      content:
        "At Luxe, we believe that your home should be a reflection of your unique style.",
    },
  },
  {
    type: "ImageText",
    label: "Image + Text",
    description: "Layout 2 cột với hình ảnh và text",
    icon: <Columns className="size-6" />,
    category: "content",
    defaultProps: {
      title: "Xây dựng cửa hàng trong vài phút",
      content: "Platform cung cấp tất cả công cụ bạn cần để khởi tạo cửa hàng.",
      image: "/images/home/feature-image.jpg",
      imagePosition: "left",
      ctaButton: { text: "Bắt đầu ngay", link: "/register" },
    },
  },
  {
    type: "Team",
    label: "Team / About",
    description: "Giới thiệu đội ngũ với avatar và social links",
    icon: <Users className="size-6" />,
    category: "content",
    defaultProps: {
      title: "Đội ngũ của chúng tôi",
      subtitle: "Những con người tài năng đứng sau thành công",
      members: [
        {
          name: "Nguyễn Văn A",
          role: "CEO",
          avatar: "",
          bio: "10+ năm kinh nghiệm",
        },
        {
          name: "Trần Thị B",
          role: "CTO",
          avatar: "",
          bio: "Chuyên gia công nghệ",
        },
      ],
      layout: "grid",
      columns: 4,
    },
  },
  {
    type: "Timeline",
    label: "Timeline",
    description: "Hiển thị lịch sử, milestones, roadmap",
    icon: <Clock className="size-6" />,
    category: "content",
    defaultProps: {
      title: "Hành trình phát triển",
      items: [
        {
          date: "2020",
          title: "Khởi đầu",
          description: "Ra mắt phiên bản đầu tiên",
          icon: "Rocket",
        },
        {
          date: "2022",
          title: "Mở rộng",
          description: "Đạt 1,000 cửa hàng",
          icon: "TrendingUp",
        },
      ],
      orientation: "vertical",
    },
  },
  {
    type: "Steps",
    label: "Steps / Process",
    description: "Hiển thị quy trình dạng số bước",
    icon: <ListOrdered className="size-6" />,
    category: "content",
    defaultProps: {
      title: "Bắt đầu chỉ với 4 bước",
      items: [
        {
          title: "Đăng ký",
          description: "Tạo tài khoản miễn phí",
          icon: "UserPlus",
        },
        {
          title: "Thiết lập",
          description: "Cấu hình cửa hàng",
          icon: "Settings",
        },
        {
          title: "Thêm sản phẩm",
          description: "Upload sản phẩm",
          icon: "Package",
        },
        { title: "Bán hàng", description: "Bắt đầu nhận đơn", icon: "Rocket" },
      ],
      layout: "horizontal",
    },
  },
  {
    type: "IconGrid",
    label: "Icon Grid",
    description: "Grid các feature icons với mô tả ngắn",
    icon: <Grid3X3 className="size-6" />,
    category: "content",
    defaultProps: {
      title: "Tại sao chọn chúng tôi?",
      items: [
        { icon: "Zap", title: "Tốc độ cao", description: "CDN toàn cầu" },
        { icon: "Shield", title: "Bảo mật", description: "SSL miễn phí" },
        { icon: "Globe", title: "Đa ngôn ngữ", description: "Nhiều ngôn ngữ" },
      ],
      columns: 3,
    },
  },

  // =====================================================================
  // COMMERCE BLOCKS
  // =====================================================================
  {
    type: "FeaturedCollection",
    label: "Featured Collection",
    description: "Premium product grid tied to a specific collection",
    icon: <Sparkles className="size-6" />,
    category: "commerce",
    defaultProps: {
      title: "The Autumn Edit",
      subtitle: "Warm tones and textures for the changing season",
      collectionName: "Fall 2024",
      count: 4,
      columns: 4,
      cardStyle: "glass",
    },
  },
  {
    type: "Products",
    label: "Products Grid",
    description: "Grid of products (Trending or New Arrivals)",
    icon: <LayoutGrid className="size-6" />,
    category: "commerce",
    defaultProps: {
      title: "Curated Selection",
      subtitle: "Discover our latest arrivals",
      type: "trending",
      count: 8,
      columns: 4,
    },
  },
  {
    type: "Categories",
    label: "Categories",
    description: "Featured categories list/grid",
    icon: <LayoutGrid className="size-6" />,
    category: "commerce",
    defaultProps: {
      title: "Featured Categories",
      subtitle: "Curated collections for every lifestyle",
      columns: 4,
      layout: "grid",
    },
  },
  {
    type: "Brands",
    label: "Brands Cloud",
    description: "Carousel of featured partner brands",
    icon: <Building2 className="size-6" />,
    category: "commerce",
    defaultProps: {
      title: "Our Trusted Partners",
      opacity: 0.8,
      grayscale: true,
      layout: "grid",
    },
  },
  {
    type: "Deal",
    label: "Deal Section",
    description: "Special deal highlight section",
    icon: <Sparkles className="size-6" />,
    category: "commerce",
    defaultProps: {
      title: "Limited Time Offer",
      subtitle: "Exclusive savings on seasonal favorites",
    },
  },
  {
    type: "Pricing",
    label: "Pricing Table",
    description: "Compare plans and pricing",
    icon: <CreditCard className="size-6" />,
    category: "commerce",
    defaultProps: {
      title: "Flexible Plans",
      items: [
        {
          name: "Standard",
          price: "$49",
          features: ["Feature 1", "Feature 2"],
        },
        {
          name: "Premium",
          price: "$129",
          isPopular: true,
          features: ["All Features"],
        },
      ],
    },
  },
  {
    type: "Comparison",
    label: "Comparison Table",
    description: "So sánh sản phẩm/gói dịch vụ dạng bảng",
    icon: <Table2 className="size-6" />,
    category: "commerce",
    defaultProps: {
      title: "So sánh các gói dịch vụ",
      columns: [
        { id: "basic", title: "Basic", price: "499.000đ" },
        { id: "pro", title: "Pro", price: "1.499.000đ", isHighlighted: true },
        { id: "enterprise", title: "Enterprise", price: "Liên hệ" },
      ],
      rows: [
        {
          feature: "Số lượng sản phẩm",
          values: { basic: "100", pro: "1,000", enterprise: "Không giới hạn" },
        },
        {
          feature: "Custom Domain",
          values: { basic: false, pro: true, enterprise: true },
        },
      ],
    },
  },
  {
    type: "Countdown",
    label: "Sales Countdown",
    description: "Urgency-driving timer for sales",
    icon: <Timer className="size-6" />,
    category: "commerce",
    defaultProps: {
      title: "Flash Sale Ending Soon",
      subtitle: "Last chance to save up to 40%",
      targetDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      ctaText: "Shop the Sale",
    },
  },
  {
    type: "LogoWall",
    label: "Logo Wall / Clients",
    description: "Grid logo khách hàng/đối tác",
    icon: <Building2 className="size-6" />,
    category: "commerce",
    defaultProps: {
      title: "Được tin tưởng bởi",
      logos: [
        { name: "Google", imageUrl: "/images/logos/google.svg" },
        { name: "Microsoft", imageUrl: "/images/logos/microsoft.svg" },
      ],
      grayscale: true,
      hoverEffect: "lift",
    },
  },

  // =====================================================================
  // ENGAGEMENT BLOCKS
  // =====================================================================
  {
    type: "Newsletter",
    label: "Newsletter",
    description: "Newsletter subscription form",
    icon: <Mail className="size-6" />,
    category: "engagement",
    defaultProps: {
      title: "Join the Inner Circle",
      description: "Be the first to know about new collections.",
    },
  },
  {
    type: "FAQ",
    label: "FAQ Section",
    description: "Frequently Asked Questions accordion",
    icon: <MessageSquare className="size-6" />,
    category: "engagement",
    defaultProps: {
      title: "Frequently Asked Questions",
      items: [
        {
          question: "How do I care for my furniture?",
          answer: "Use a soft, damp cloth.",
        },
        {
          question: "What is your return policy?",
          answer: "30-day trial period.",
        },
      ],
    },
  },
  {
    type: "Testimonials",
    label: "Testimonials",
    description: "Customer reviews carousel",
    icon: <MessageSquare className="size-6" />,
    category: "engagement",
    defaultProps: {
      title: "Client Experiences",
      items: [
        {
          text: "The attention to detail is unmatched.",
          author: "Alexander",
          rating: 5,
        },
        {
          text: "Fast shipping and quality exceeded expectations.",
          author: "Sophia",
          rating: 5,
        },
      ],
    },
  },
  {
    type: "ContactForm",
    label: "Contact Form",
    description: "Form liên hệ với các trường tùy chỉnh",
    icon: <Mail className="size-6" />,
    category: "engagement",
    defaultProps: {
      title: "Liên hệ với chúng tôi",
      fields: [
        { id: "name", type: "text", label: "Họ và tên", required: true },
        { id: "email", type: "email", label: "Email", required: true },
        { id: "message", type: "textarea", label: "Nội dung", required: true },
      ],
      layout: "split",
      showContactInfo: true,
    },
  },
  {
    type: "Blog",
    label: "Blog / News",
    description: "Hiển thị bài viết từ API",
    icon: <Newspaper className="size-6" />,
    category: "engagement",
    defaultProps: {
      title: "Blog & Tin tức",
      layout: "grid",
      columns: 3,
      showExcerpt: true,
      showAuthor: true,
    },
  },
  {
    type: "CTASection",
    label: "Call to Action",
    description: "Highlighted section with strong CTA",
    icon: <MousePointerClick className="size-6" />,
    category: "engagement",
    defaultProps: {
      title: "Elevate Your Living Space",
      subtitle: "Transform your home with our exclusive design services",
      buttonText: "Book Consultation",
      buttonLink: "/contact",
    },
  },
  {
    type: "Features",
    label: "Features Grid",
    description: "Grid of feature cards with icons",
    icon: <LayoutGrid className="size-6" />,
    category: "engagement",
    defaultProps: {
      title: "Why Choose Luxe",
      items: [
        {
          title: "Global Shipping",
          description: "Complimentary delivery worldwide",
        },
        {
          title: "Premium Quality",
          description: "Handcrafted by master artisans",
        },
      ],
    },
  },
  {
    type: "Stats",
    label: "Stats Grid",
    description: "Display key metrics and numbers",
    icon: <LayoutGrid className="size-6" />,
    category: "engagement",
    defaultProps: {
      items: [
        { label: "Happy Customers", value: "10k+" },
        { label: "Premium Products", value: "500+" },
      ],
    },
  },

  // =====================================================================
  // ADVANCED BLOCKS
  // =====================================================================
  {
    type: "Map",
    label: "Map",
    description: "Embed Google Maps hoặc static map",
    icon: <MapPin className="size-6" />,
    category: "advanced",
    defaultProps: {
      title: "Vị trí của chúng tôi",
      address: "123 Nguyễn Văn Linh, Q.7, TP.HCM",
      lat: 10.7328,
      lng: 106.7213,
      zoom: 15,
      height: "lg",
      showInfoWindow: true,
    },
  },
  {
    type: "Embed",
    label: "Code / Embed",
    description: "Nhúng custom HTML/JS/iframe",
    icon: <Code2 className="size-6" />,
    category: "advanced",
    defaultProps: {
      embedType: "iframe",
      embedUrl: "",
      height: "450px",
      aspectRatio: "16/9",
      sanitize: true,
    },
  },
  {
    type: "SocialFeed",
    label: "Social Feed",
    description: "Hiển thị social links hoặc feed",
    icon: <Share2 className="size-6" />,
    category: "advanced",
    defaultProps: {
      title: "Kết nối với chúng tôi",
      links: [
        { platform: "facebook", url: "#" },
        { platform: "instagram", url: "#" },
        { platform: "twitter", url: "#" },
      ],
      layout: "horizontal",
      style: "filled",
      colorful: true,
    },
  },
];

interface AddBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddBlock: (blockType: BlockType) => void;
}

export function AddBlockDialog({
  open,
  onOpenChange,
  onAddBlock,
}: AddBlockDialogProps) {
  const [activeCategory, setActiveCategory] = useState<BlockCategory | "all">(
    "all"
  );

  const handleSelect = (block: BlockType) => {
    onAddBlock(block);
    onOpenChange(false);
  };

  const filteredBlocks =
    activeCategory === "all"
      ? AVAILABLE_BLOCKS
      : AVAILABLE_BLOCKS.filter((block) => block.category === activeCategory);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl! max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="flex-none p-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-serif">
            Thêm Block mới
          </DialogTitle>
          <DialogDescription className="text-base">
            Chọn một block để thêm vào trang của bạn
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Categories */}
          <div className="w-56 border-r bg-muted/30 p-4 flex-shrink-0 overflow-y-auto">
            <button
              onClick={() => setActiveCategory("all")}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1",
                activeCategory === "all"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              Tất cả ({AVAILABLE_BLOCKS.length})
            </button>

            <div className="h-px bg-border my-3" />

            {BLOCK_CATEGORIES.map((category) => {
              const count = AVAILABLE_BLOCKS.filter(
                (b) => b.category === category.id
              ).length;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg transition-colors mb-1",
                    activeCategory === category.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        activeCategory === category.id
                          ? "text-primary-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {category.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">
                        {category.label}
                      </div>
                      <div
                        className={cn(
                          "text-xs truncate",
                          activeCategory === category.id
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        )}
                      >
                        {count} blocks
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Main Content - Blocks Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredBlocks.map((block) => (
                <Button
                  key={block.type}
                  variant="outline"
                  className={cn(
                    "h-auto p-4 flex flex-col items-center gap-3 text-center",
                    "hover:border-primary hover:bg-primary/5 transition-all",
                    "group"
                  )}
                  onClick={() => handleSelect(block)}
                >
                  <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {block.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{block.label}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {block.description}
                    </p>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
