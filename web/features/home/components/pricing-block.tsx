

"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { m } from "@/lib/animations";

interface PricingItem {
  name: string;
  price: string;
  period?: string;
  description?: string;
  features: string[];
  ctaText: string;
  ctaLink: string;
  isPopular?: boolean;
}

interface PricingBlockProps {
  title?: string;
  subtitle?: string;
  items?: PricingItem[];
  styles?: {
    backgroundColor?: string;
    textColor?: string;
  };
}

export function PricingBlock({
  title = "Flexible Pricing Plans",
  subtitle = "Choose the perfect plan for your lifestyle",
  items = [
    {
      name: "Basic",
      price: "$29",
      period: "/month",
      description: "Essentials for luxury living",
      features: [
        "Standard Support",
        "Access to Basic Collection",
        "Free Consultation",
      ],
      ctaText: "Get Started",
      ctaLink: "/shop",
    },
    {
      name: "Pro",
      price: "$99",
      period: "/month",
      description: "Most popular for enthusiasts",
      features: [
        "Priority Support",
        "Full Access to Collection",
        "Unlimited Consultations",
        "Early Access to Sales",
      ],
      isPopular: true,
      ctaText: "Upgrade to Pro",
      ctaLink: "/shop",
    },
    {
      name: "Elite",
      price: "$249",
      period: "/month",
      description: "Exclusive benefits for connoisseurs",
      features: [
        "24/7 Concierge Support",
        "Bespoke Customization",
        "Personal Interior Designer",
        "Private Showroom Access",
      ],
      ctaText: "Go Elite",
      ctaLink: "/shop",
    },
  ],
  styles,
}: PricingBlockProps) {
  return (
    <section
      className="py-24 px-4 overflow-hidden"
      style={{
        backgroundColor: styles?.backgroundColor,
        color: styles?.textColor,
      }}
    >
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <m.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-serif font-medium mb-4"
          >
            {title}
          </m.h2>
          <m.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            {subtitle}
          </m.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((item, idx) => (
            <m.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "relative p-8 rounded-4xl border transition-all duration-300 group",
                item.isPopular
                  ? "bg-slate-900 text-white shadow-2xl scale-105 border-primary/20 z-10"
                  : "bg-background border-border hover:border-primary/50"
              )}
            >
              {item.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                  Recommendation
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                <p
                  className={cn(
                    "text-sm",
                    item.isPopular ? "text-slate-400" : "text-muted-foreground"
                  )}
                >
                  {item.description}
                </p>
              </div>

              <div className="mb-8">
                <span className="text-4xl md:text-5xl font-serif font-bold">
                  {item.price}
                </span>
                <span
                  className={cn(
                    "text-lg",
                    item.isPopular ? "text-slate-400" : "text-muted-foreground"
                  )}
                >
                  {item.period}
                </span>
              </div>

              <div className="space-y-4 mb-8">
                {item.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-1 p-0.5 rounded-full",
                        item.isPopular
                          ? "bg-primary/20 text-primary"
                          : "bg-primary/10 text-primary"
                      )}
                    >
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-sm opacity-90">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                className={cn(
                  "w-full h-12 rounded-xl font-bold transition-all transform group-hover:scale-105",
                  item.isPopular
                    ? "bg-white text-slate-900 hover:bg-slate-100"
                    : "bg-primary text-primary-foreground"
                )}
                asChild
              >
                <a href={item.ctaLink}>{item.ctaText}</a>
              </Button>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
