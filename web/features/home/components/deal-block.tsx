"use client";

import { DealSection } from "@/features/marketing/components/deal-section";
import { m } from "@/lib/animations";

interface DealBlockProps {
  title?: string;
  subtitle?: string;
  description?: string;
  styles?: {
    backgroundColor?: string;
    textColor?: string;
  };
}


export function DealBlock({
  title,
  subtitle,
  description,
  styles,
}: DealBlockProps) {
  return (
    <div
      className="w-full"
      style={{
        backgroundColor: styles?.backgroundColor,
        color: styles?.textColor,
      }}
    >
      <m.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={{
          hidden: { opacity: 0, scale: 0.95 },
          visible: { opacity: 1, scale: 1, transition: { duration: 0.8 } },
        }}
      >
        <DealSection
          title={title}
          summerTitle={subtitle}
          description={description}
        />
      </m.div>
    </div>
  );
}
