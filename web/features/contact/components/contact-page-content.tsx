"use client";

import { ContactForm } from "@/features/contact/components/contact-form";
import { ContactInfoCards } from "@/features/contact/components/contact-info-cards";
import { ContactMap } from "@/features/contact/components/contact-map";
import { FAQGrid } from "@/features/marketing/components/faq-grid";
import { m } from "@/lib/animations";
import { useTranslations } from "next-intl";

/**
 * =====================================================================
 * CONTACT PAGE CONTENT - Trang liên hệ và phản hồi
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * ATOMIC DESIGN REFACTOR:
 * - Page này đóng vai trò là Template, lắp ghép các Organisms lại với nhau.
 * - Logic phức tạp (Form handling, Map rendering) được đẩy xuống các Organisms.
 * - Template chỉ lo việc layout và animations cấp cao.
 *
 * COMPONENTS:
 * 1. ContactInfoCards: Hiển thị thông tin liên hệ (Email, Phone, Address).
 * 2. ContactForm: Form gửi tin nhắn.
 * 3. ContactMap: Bản đồ Google Map.
 * 4. FAQGrid: Các câu hỏi thường gặp.
 * =====================================================================
 */

export function ContactPageContent() {
  const t = useTranslations("contact");

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
  };

  return (
    <div className="min-h-screen bg-background pt-28 pb-16 font-sans selection:bg-accent/30 relative overflow-clip">
      {/* Background Gradients - Quiet Luxury */}
      <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[200px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[800px] h-[800px] bg-secondary/30 rounded-full blur-[150px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        {/* Header Section */}
        <m.div
          className="text-center mb-16"
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          <div className="inline-block mb-4 px-4 py-2 rounded-full bg-secondary border border-border text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground">
            {t("badge", { defaultMessage: "Get in Touch" })}
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-normal text-foreground mb-8 tracking-tight">
            {t("title")}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
            {t("subtitle")}
          </p>
        </m.div>

        {/* Main Content - Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-24 items-start">
          {/* Left Column: Contact Info */}
          <m.div
            className="lg:col-span-4"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <ContactInfoCards className="grid-cols-1 md:grid-cols-1 lg:grid-cols-1 mb-0 gap-6" />
          </m.div>

          {/* Right Column: Contact Form */}
          <m.div
            className="lg:col-span-8"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <ContactForm />
          </m.div>
        </div>

        {/* Map Section */}
        <div className="mb-24 h-[50vh] min-h-[400px] w-full">
          <ContactMap />
        </div>

        {/* FAQ Section */}
        <m.div
          className="mt-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={sectionVariants}
        >
          <div className="text-center mb-12">
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-accent mb-3 block">
              {t("faq.subtitle")}
            </span>
            <h2 className="text-4xl font-serif font-normal mb-6 tracking-tight text-foreground">
              {t("faq.title")}
            </h2>
          </div>
          <FAQGrid />
        </m.div>
      </div>
    </div>
  );
}
