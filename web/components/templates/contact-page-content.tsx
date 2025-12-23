"use client";

import { ContactForm } from "@/components/organisms/contact-form";
import { ContactInfoCards } from "@/components/organisms/contact-info-cards";
import { ContactMap } from "@/components/organisms/contact-map";
import { FAQGrid } from "@/components/organisms/faq-grid";
import { motion } from "framer-motion";
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
    <div className="min-h-screen bg-background pt-24 pb-12 font-sans selection:bg-primary/30 relative overflow-clip">
      {/* Background Gradients - Luxe Theme */}
      <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[800px] h-[800px] bg-accent/10 rounded-full blur-[180px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        {/* Header Section */}
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          <div className="inline-block mb-6 px-6 py-2.5 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-black tracking-[0.25em] uppercase shadow-lg shadow-accent/10 backdrop-blur-md">
            {t("badge", { defaultMessage: "Get in Touch" })}
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-foreground mb-8 tracking-tighter">
            {t("title")}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground/70 max-w-3xl mx-auto leading-relaxed font-medium">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Main Content - Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-24 items-start">
          {/* Left Column: Contact Info */}
          <motion.div
            className="lg:col-span-4"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <ContactInfoCards className="grid-cols-1 md:grid-cols-1 lg:grid-cols-1 mb-0 gap-6" />
          </motion.div>

          {/* Right Column: Contact Form */}
          <motion.div
            className="lg:col-span-8"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <ContactForm />
          </motion.div>
        </div>

        {/* Map Section */}
        <div className="mb-24 h-[50vh] min-h-[400px] w-full">
          <ContactMap />
        </div>

        {/* FAQ Section */}
        <motion.div
          className="mt-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={sectionVariants}
        >
          <div className="text-center mb-12">
            <span className="text-accent font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">
              {t("faq.subtitle")}
            </span>
            <h2 className="text-4xl font-black mb-6 tracking-tight text-foreground">
              {t("faq.title")}
            </h2>
          </div>
          <FAQGrid />
        </motion.div>
      </div>
    </div>
  );
}
