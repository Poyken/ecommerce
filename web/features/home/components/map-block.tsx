"use client";

/**
 * =====================================================================
 * MAP BLOCK - Embed Google Maps hoặc static map
 * =====================================================================
 */

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { MapPin, Navigation } from "lucide-react";
import type { BaseBlockProps } from "../types/block-types";

interface MapBlockProps extends BaseBlockProps {
  title?: string;
  subtitle?: string;
  address?: string;
  lat?: number;
  lng?: number;
  zoom?: number;
  height?: "sm" | "md" | "lg" | "xl";
  showInfoWindow?: boolean;
  infoWindowContent?: {
    title?: string;
    address?: string;
    phone?: string;
  };
  mapStyle?: "default" | "dark" | "light" | "satellite";
  showDirectionsButton?: boolean;
  borderRadius?: "none" | "md" | "lg" | "xl" | "2xl";
}

export function MapBlock({
  title,
  subtitle,
  address = "123 Nguyễn Văn Linh, Quận 7, TP.HCM",
  lat = 10.7328,
  lng = 106.7213,
  zoom = 15,
  height = "lg",
  showInfoWindow = true,
  infoWindowContent = {
    title: "Luxe SaaS Headquarters",
    address: "123 Nguyễn Văn Linh, Quận 7, TP.HCM",
    phone: "+84 28 1234 5678",
  },
  mapStyle = "default",
  showDirectionsButton = true,
  borderRadius = "2xl",
}: MapBlockProps) {
  const heights = {
    sm: "h-64",
    md: "h-80",
    lg: "h-96",
    xl: "h-[500px]",
  };

  const borderRadii = {
    none: "rounded-none",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
  };

  // Construct Google Maps embed URL
  const getMapUrl = () => {
    const baseUrl = "https://www.google.com/maps/embed/v1/place";
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    const query = encodeURIComponent(address);

    // If API key is available, use the official embed API
    if (apiKey) {
      return `${baseUrl}?key=${apiKey}&q=${query}&zoom=${zoom}`;
    }

    // Fallback to iframe embed without API key (limited features)
    return `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
  };

  const getDirectionsUrl = () => {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  };

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        {(title || subtitle) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-lg text-muted-foreground">{subtitle}</p>
            )}
          </motion.div>
        )}

        {/* Map Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          {/* Map Frame */}
          <div
            className={cn(
              "relative overflow-hidden border border-border",
              heights[height],
              borderRadii[borderRadius]
            )}
          >
            <iframe
              src={getMapUrl()}
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Google Maps"
              allowFullScreen
            />

            {/* Info Window Overlay */}
            {showInfoWindow && infoWindowContent && (
              <div className="absolute top-4 left-4 right-4 md:right-auto md:max-w-sm">
                <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl p-4 shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="size-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      {infoWindowContent.title && (
                        <h3 className="font-semibold text-sm">
                          {infoWindowContent.title}
                        </h3>
                      )}
                      {infoWindowContent.address && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {infoWindowContent.address}
                        </p>
                      )}
                      {infoWindowContent.phone && (
                        <a
                          href={`tel:${infoWindowContent.phone}`}
                          className="text-xs text-primary hover:underline mt-1 inline-block"
                        >
                          {infoWindowContent.phone}
                        </a>
                      )}
                    </div>
                  </div>

                  {showDirectionsButton && (
                    <a
                      href={getDirectionsUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "mt-3 w-full flex items-center justify-center gap-2",
                        "px-4 py-2 rounded-lg text-sm font-medium",
                        "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      )}
                    >
                      <Navigation className="size-4" />
                      Chỉ đường
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
