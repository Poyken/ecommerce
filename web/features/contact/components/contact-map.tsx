/**
 * =====================================================================
 * CONTACT MAP - Bản đồ vị trí cửa hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. GOOGLE MAPS EMBED:
 * - Sử dụng iframe để nhúng bản đồ Google Maps trực tiếp vào trang liên hệ.
 *
 * 2. FLOATING LOCATION CARD:
 * - Hiển thị một thẻ thông tin nổi trên bản đồ chứa địa chỉ và trạng thái "Open Now" để tăng tính tương tác.
 * =====================================================================
 */

"use client";

import { m } from "@/lib/animations";
import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";

export function ContactMap() {
  const t = useTranslations("contact");

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: 0.4 }}
      className="h-full rounded-3xl overflow-hidden relative shadow-2xl border border-white/10 bg-muted/20 backdrop-blur-sm group"
    >
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d387193.30596073366!2d-74.25986548248684!3d40.69714941932609!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2s!4v1645564756836!5m2!1sen!2s"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        className="absolute inset-0 w-full h-full"
      />

      {/* Floating Location Card */}
      <div className="absolute bottom-6 left-6 md:right-auto md:w-80 bg-white/80 dark:bg-black/80 backdrop-blur-xl p-5 rounded-2xl border border-white/20 shadow-2xl transform transition-transform hover:scale-105 duration-300">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h4 className="font-bold text-base text-foreground">
              {t("map.storeName")}
            </h4>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {t("map.addressLine1")}
              <br />
              {t("map.addressLine2")}
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs font-bold text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              {t("map.openNow")}
            </div>
          </div>
        </div>
      </div>
    </m.div>
  );
}
