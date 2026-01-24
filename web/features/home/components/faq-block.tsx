"use client";

import { FAQAccordion } from "@/features/marketing/components/faq-accordion";
import { fadeInUp } from "@/lib/animations";
import { m } from "framer-motion";
import { useTranslations } from "next-intl";

// Mock Data for Admin Review
const MOCK_FAQ_ITEMS = [
  {
    question: "How long does shipping take?",
    answer: "Domestic orders typically arrive within 3-5 business days.",
  },
  {
    question: "What is your return policy?",
    answer:
      "We offer a 30-day return policy for all unused items in original packaging.",
  },
  {
    question: "Do you ship internationally?",
    answer:
      "Yes, we ship to over 100 countries worldwide. Shipping rates vary by location.",
  },
];

interface FAQBlockProps {
  title?: string;
  subtitle?: string;
  items?: Array<{ question: string; answer: string }>;
  styles?: {
    backgroundColor?: string;
    textColor?: string;
  };
}


export function FAQBlock({ title, subtitle, items, styles }: FAQBlockProps) {
  const t = useTranslations("home");

  // Use props items or mock items if in admin/empty state
  const displayItems = items && items.length > 0 ? items : MOCK_FAQ_ITEMS;
  const isMock = !items || items.length === 0;

  return (
    <div
      className="w-full"
      style={{
        backgroundColor: styles?.backgroundColor,
        color: styles?.textColor,
      }}
    >
      <section className="container mx-auto px-4 max-w-4xl py-24">
        <m.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">
            {subtitle || t("faq.subtitle")}
          </span>
          <h2 className="text-4xl font-black tracking-tighter uppercase italic">
            {title || t("faq.title")}
          </h2>
        </m.div>
        <m.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className={isMock ? "opacity-70 pointer-events-none" : ""}
        >
          <FAQAccordion items={displayItems} />
          {isMock && (
            <div className="mt-4 text-center">
              <span className="inline-block px-3 py-1 text-[10px] uppercase font-bold bg-yellow-100 text-yellow-800 rounded-full border border-yellow-200">
                Preview Mode
              </span>
            </div>
          )}
        </m.div>
      </section>
    </div>
  );
}
