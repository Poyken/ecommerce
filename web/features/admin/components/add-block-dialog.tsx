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
} from "lucide-react";
import * as LucideIcons from "lucide-react";

export interface BlockType {
  type: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  defaultProps: Record<string, any>;
}

export const AVAILABLE_BLOCKS: BlockType[] = [
  // 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
  // Đây là nơi định nghĩa "Menu" các khối (Block) mà User có thể thêm vào trang.
  // Mỗi Block có:
  // - type: Định danh duy nhất (dùng để switch-case trong BlockRenderer).
  // - defaultProps: Dữ liệu mẫu ban đầu (để khi vừa thêm vào không bị trống trơn).
  // - icon: Biểu tượng minh họa.
  {
    type: "Hero",
    label: "Hero Section",
    description: "Large banner with title, subtitle and CTA button",
    icon: <Sparkles className="h-6 w-6" />,
    defaultProps: {
      title: "Redefining Luxury Living",
      subtitle:
        "Experience the epitome of elegance with our curated selection of bespoke furniture.",
      badge: "New Collection",
      ctaText: "Shop Collection",
      ctaLink: "/shop",
      secondaryCtaText: "Our Story",
      secondaryCtaLink: "/about",
      layout: "split",
      height: "screen",
      contentWidth: "medium",
      titleSize: "xlarge",
      titleFont: "serif",
      subtitleSize: "medium",
      bgImage: "/images/home/hero-luxury.jpg",
      bgColor: "bg-background",
      overlayType: "dark",
      overlayOpacity: 0.4,
      animationType: "fade",
      animationDelay: 0,
      ctaStyle: "solid",
      ctaRounded: "full",
      showFeaturedCard: true,
      featuredTitle: "Signature Collection",
      featuredPrice: "$1,299",
      showBottomFeatures: true,
    },
  },
  {
    type: "Categories",
    label: "Categories",
    description: "Featured categories list/grid",
    icon: <LayoutGrid className="h-6 w-6" />,
    defaultProps: {
      title: "Featured Categories",
      subtitle: "Curated collections for every lifestyle",
      columns: 4,
      layout: "grid",
      cardStyle: "default",
      alignment: "left",
      animationType: "fade",
    },
  },
  {
    type: "Brands",
    label: "Brands Cloud",
    description: "Carousel of featured partner brands",
    icon: <LayoutGrid className="h-6 w-6" />, // Or another icon
    defaultProps: {
      title: "Our Trusted Partners",
      subtitle: "Collaborating with the world's finest artisans",
      opacity: 0.8,
      grayscale: true,
      layout: "grid",
      logoSize: "md",
      hoverEffect: "lift",
      alignment: "left",
    },
  },
  {
    type: "Products",
    label: "Products Grid",
    description: "Grid of products (Trending or New Arrivals)",
    icon: <LayoutGrid className="h-6 w-6" />,
    defaultProps: {
      title: "Curated Selection",
      subtitle: "Discover our latest high-end arrivals",
      type: "trending", // or "new_arrivals"
      count: 8,
      columns: 4,
      layout: "grid",
      alignment: "center",
      cardStyle: "default",
    },
  },
  {
    type: "Deal",
    label: "Deal Section",
    description: "Special deal highlight section",
    icon: <Sparkles className="h-6 w-6" />,
    defaultProps: {
      title: "Limited Time Offer",
      subtitle: "Exclusive savings on seasonal favorites",
    },
  },
  {
    type: "PromoGrid",
    label: "Promo Grid",
    description: "Two-column promo banner grid",
    icon: <ImageIcon className="h-6 w-6" />,
    defaultProps: {},
  },
  {
    type: "Features",
    label: "Features Grid",
    description: "Grid of feature cards with icons",
    icon: <LayoutGrid className="h-6 w-6" />,
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
        {
          title: "White Glove Service",
          description: "Personalized concierge support",
        },
      ],
    },
  },
  {
    type: "Stats",
    label: "Stats Grid",
    description: "Display key metrics and numbers",
    icon: <LayoutGrid className="h-6 w-6" />,
    defaultProps: {
      items: [
        { label: "Happy Customers", value: "10k+", color: "primary" },
        { label: "Premium Products", value: "500+", color: "secondary" },
        { label: "Global Brands", value: "50+", color: "primary" },
        { label: "Customer Support", value: "24/7", color: "secondary" },
      ],
    },
  },
  {
    type: "Testimonials",
    label: "Testimonials",
    description: "Customer reviews carousel",
    icon: <Type className="h-6 w-6" />, // Chat icon ideally
    defaultProps: {
      title: "Client Experiences",
      subtitle: "What our community is saying about Luxe",
      items: [
        {
          text: "The attention to detail in their pieces is unmatched.",
          author: "Alexander Thorne",
          role: "Interior Designer",
          rating: 5,
        },
        {
          text: "Fast shipping and the quality exceeded my expectations.",
          author: "Sophia Laurent",
          role: "Art Director",
          rating: 5,
        },
      ],
    },
  },
  {
    type: "FAQ",
    label: "FAQ Section",
    description: "Frequently Asked Questions accordion",
    icon: <Type className="h-6 w-6" />,
    defaultProps: {
      title: "Frequently Asked Questions",
      subtitle: "Everything you need to know",
      items: [
        {
          question: "How do I care for my furniture?",
          answer:
            "We recommend using a soft, damp cloth for routine cleaning and avoiding direct sunlight for natural woods.",
        },
        {
          question: "What is your return policy?",
          answer:
            "We offer a 30-day trial period. If you're not completely satisfied, we'll arrange a return or exchange.",
        },
      ],
    },
  },
  {
    type: "Newsletter",
    label: "Newsletter",
    description: "Newsletter subscription form",
    icon: <MousePointerClick className="h-6 w-6" />, // Mail icon ideally
    defaultProps: {
      title: "Join the Inner Circle",
      description:
        "Be the first to know about new collections and exclusive events.",
    },
  },
  {
    type: "Pricing",
    label: "Pricing Table",
    description: "Compare plans and pricing with feature lists",
    icon: <LucideIcons.CreditCard className="h-6 w-6" />,
    defaultProps: {
      title: "Flexible Luxury Plans",
      subtitle: "Choose the perfect membership for your lifestyle",
      items: [
        {
          name: "Standard",
          price: "$49",
          period: "/mo",
          description: "Essential luxury for individuals",
          features: [
            "Exclusive Support",
            "Standard Delivery",
            "Monthly Consultation",
          ],
          ctaText: "Select Plan",
          ctaLink: "#",
        },
        {
          name: "Premium",
          price: "$129",
          period: "/mo",
          description: "Our most popular choice",
          features: [
            "24/7 Priority Support",
            "White Glove Delivery",
            "Weekly Consultation",
            "Early Access",
          ],
          isPopular: true,
          ctaText: "Join Premium",
          ctaLink: "#",
        },
      ],
    },
  },
  {
    type: "Gallery",
    label: "Image Gallery",
    description: "Elegant masonry-style image grid with lightbox",
    icon: <LucideIcons.Images className="h-6 w-6" />,
    defaultProps: {
      title: "Our Finest Creations",
      subtitle: "Explore the artistry behind our curated collections",
      images: [
        {
          src: "/images/home/hero-luxury.jpg",
          alt: "Gallery 1",
          title: "Velvet Elegance",
          category: "Interior",
          span: "large",
        },
        {
          src: "/images/home/promo-furniture.jpg",
          alt: "Gallery 2",
          title: "Modernist Form",
          category: "Furniture",
          span: "tall",
        },
        {
          src: "/images/home/promo-living.jpg",
          alt: "Gallery 3",
          title: "Soft Serenity",
          category: "Bedroom",
          span: "normal",
        },
        {
          src: "/images/home/hero-luxury.jpg",
          alt: "Gallery 4",
          title: "Craftsmanship",
          category: "Detail",
          span: "normal",
        },
      ],
    },
  },
  {
    type: "Marquee",
    label: "Magic Marquee",
    description: "Infinite scrolling text banner for announcements",
    icon: <LucideIcons.Zap className="h-6 w-6" />,
    defaultProps: {
      items: [
        "PREMIUM QUALITY",
        "GLOBAL SHIPPING",
        "CONCIERGE SERVICE",
        "EXPERT CRAFTSMANSHIP",
      ],
      speed: 30,
      direction: "left",
    },
  },
  {
    type: "Countdown",
    label: "Sales Countdown",
    description: "Urgency-driving timer for sales and events",
    icon: <LucideIcons.Timer className="h-6 w-6" />,
    defaultProps: {
      title: "Flash Sale Ending Soon",
      subtitle: "Last chance to save up to 40% on the Winter Collection.",
      targetDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      ctaText: "Shop the Sale",
      ctaLink: "/shop",
    },
  },
  {
    type: "Banner",
    label: "Banner",
    description: "Image banner with optional text overlay",
    icon: <ImageIcon className="h-6 w-6" />,
    defaultProps: {
      title: "The Summer Collection",
      subtitle: "Embrace the warmth with our finest outdoor arrangements",
      imageUrl: "",
      ctaText: "Explore Now",
      ctaLink: "/shop",
    },
  },
  {
    type: "TextBlock",
    label: "Text Block",
    description: "Rich text content block",
    icon: <Type className="h-6 w-6" />,
    defaultProps: {
      title: "Our Philosophy",
      content:
        "At Luxe, we believe that your home should be a reflection of your unique style and aspirations. Our collections are designed to bring harmony, sophistication, and timeless beauty to your living spaces.",
    },
  },
  {
    type: "CTASection",
    label: "Call to Action",
    description: "Highlighted section with strong call to action",
    icon: <MousePointerClick className="h-6 w-6" />,
    defaultProps: {
      title: "Elevate Your Living Space",
      subtitle:
        "Transform your home with our exclusive interior design services",
      buttonText: "Book Consultation",
      buttonLink: "/contact",
    },
  },
  {
    type: "Header",
    label: "Sticky Header",
    description: "Configurable site header with navigation links",
    icon: <LayoutGrid className="h-6 w-6" />,
    defaultProps: {
      transparent: false,
      fullWidth: false,
      customHeight: 80,
      links: [
        { label: "Home", href: "/" },
        { label: "Shop", href: "/shop" },
        { label: "About", href: "/about" },
        { label: "Contact", href: "/contact" },
      ],
      utils: [
        { icon: "Search", label: "Search", href: "/search" },
        { icon: "ShoppingCart", label: "Cart", href: "/cart" },
        { icon: "User", label: "Account", href: "/admin" },
      ],
    },
  },
  {
    type: "FlexLayout",
    label: "Flex Layout",
    description:
      "Multi-column layout with customizable content, icons and images",
    icon: <LucideIcons.LayoutPanelTop className="h-6 w-6" />,
    defaultProps: {
      title: "Elevate Your Perspective",
      subtitle: "Custom content arrangements for a bespoke digital experience",
      layout: "1-1",
      gap: "medium",
      items: [
        {
          title: "Modern Craftsmanship",
          description:
            "Details that define excellence in every corner of your home.",
          image: "/images/home/promo-furniture.jpg",
          theme: "dark",
          alignment: "left",
        },
        {
          title: "Our Philosophy",
          description: "Beauty and functionality working in perfect harmony.",
          icon: "Sparkles",
          theme: "glass",
          alignment: "center",
          link: "/about",
          linkText: "Read More",
        },
      ],
    },
  },
  {
    type: "VideoHero",
    label: "Cinematic Video Hero",
    description: "High-impact video banner with luxury aesthetic",
    icon: <LucideIcons.Tv className="h-6 w-6" />,
    defaultProps: {
      title: "Pure Elegance in Motion",
      subtitle: "Experience luxury redefined through cinematic storytelling.",
      videoUrl:
        "https://cdn.pixabay.com/video/2021/04/12/70860-537446549_tiny.mp4",
      overlayOpacity: 0.5,
      height: "large",
      alignment: "center",
      theme: "luxury",
    },
  },
  {
    type: "Footer",
    label: "Site Footer",
    description: "Global footer with social links and company info",
    icon: <LayoutGrid className="h-6 w-6" />,
    defaultProps: {
      companyName: "Luxe Premium",
      description:
        "Defining the future of luxury living with curated furniture and decor.",
      socialLinks: [
        { platform: "Instagram", url: "#" },
        { platform: "Facebook", url: "#" },
        { platform: "Twitter", url: "#" },
      ],
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
  const handleSelect = (block: BlockType) => {
    onAddBlock(block);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl! max-h-[90vh] flex flex-col p-8">
        <DialogHeader className="flex-none pb-6">
          <DialogTitle className="text-2xl font-serif">
            Add New Block
          </DialogTitle>
          <DialogDescription className="text-base">
            Choose a premium block type to enhance your page design
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2 mt-2 custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
            {AVAILABLE_BLOCKS.map((block) => (
              <Button
                key={block.type}
                variant="outline"
                className={cn(
                  "h-auto p-4 flex flex-col items-center gap-3 text-center",
                  "hover:border-primary hover:bg-primary/5 transition-all"
                )}
                onClick={() => handleSelect(block)}
              >
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
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
      </DialogContent>
    </Dialog>
  );
}
