"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { useState } from "react";

const faqs = [
  {
    q: "What is your return policy?",
    a: "We offer a 30-day return policy for all unused items in their original packaging. Simply contact our support team to initiate the process.",
  },
  {
    q: "Do you ship internationally?",
    a: "Yes, we ship to over 100 countries worldwide via DHL Express. Shipping times and costs vary by location and are calculated at checkout.",
  },
  {
    q: "How do I track my order?",
    a: "Once your order has been shipped, you will receive a confirmation email with a comprehensive tracking number that you can use to monitor your package's journey.",
  },
  {
    q: "Are your products authentic?",
    a: "Absolutely. We are an authorized retailer and guarantee the authenticity of every product we sell. Each item comes with a certificate of authenticity.",
  },
];

export function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      {faqs.map((faq, i) => (
        <GlassCard
          key={i}
          className={cn(
            "px-6 py-4 cursor-pointer transition-all duration-300",
            openIndex === i ? "bg-white/10 border-primary/20" : "hover:bg-white/5 hover:border-white/20"
          )}
          onClick={() => setOpenIndex(openIndex === i ? null : i)}
        >
          <div className="flex justify-between items-center font-bold">
            <span className={cn(openIndex === i ? "text-primary" : "text-foreground")}>
                {faq.q}
            </span>
            <span
              className={cn(
                "transition-transform duration-300 text-muted-foreground",
                openIndex === i ? "rotate-180 text-primary" : ""
              )}
            >
              ▼
            </span>
          </div>
          <div
            className={cn(
              "grid transition-all duration-300 ease-in-out text-muted-foreground",
              openIndex === i ? "grid-rows-[1fr] opacity-100 mt-3 pt-3 border-t border-white/5" : "grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="overflow-hidden">
               {faq.a}
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
