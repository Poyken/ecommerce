"use client";

/**
 * =====================================================================
 * EMBED BLOCK - Cho phép nhúng custom HTML/JS/iframe
 * =====================================================================
 */

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import type { BaseBlockProps } from "../types/block-types";

interface EmbedBlockProps extends BaseBlockProps {
  title?: string;
  code?: string;
  embedUrl?: string;
  embedType?: "html" | "iframe" | "video" | "social";
  height?: string;
  aspectRatio?: "auto" | "16/9" | "4/3" | "1/1" | "9/16";
  fullWidth?: boolean;
  sanitize?: boolean;
  allowScripts?: boolean;
  borderRadius?: "none" | "md" | "lg" | "xl" | "2xl";
  showBorder?: boolean;
}

export function EmbedBlock({
  title,
  code,
  embedUrl,
  embedType = "iframe",
  height = "450px",
  aspectRatio = "auto",
  fullWidth = true,
  sanitize = true,
  allowScripts = false,
  borderRadius = "xl",
  showBorder = true,
}: EmbedBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const borderRadii = {
    none: "rounded-none",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
  };

  const aspectRatios = {
    auto: "",
    "16/9": "aspect-video",
    "4/3": "aspect-[4/3]",
    "1/1": "aspect-square",
    "9/16": "aspect-[9/16]",
  };

  // Handle HTML embed
  useEffect(() => {
    if (embedType === "html" && code && containerRef.current) {
      let sanitizedCode = code;

      if (sanitize && !allowScripts) {
        // Sanitize HTML to prevent XSS
        sanitizedCode = DOMPurify.sanitize(code, {
          ADD_TAGS: ["iframe"],
          ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling"],
        });
      }

      containerRef.current.innerHTML = sanitizedCode;
    }
  }, [code, embedType, sanitize, allowScripts]);

  // Render iframe embed
  if (embedType === "iframe" && embedUrl) {
    return (
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          {title && (
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold tracking-tight mb-8 text-center"
            >
              {title}
            </motion.h2>
          )}

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={cn(
              "relative overflow-hidden",
              fullWidth ? "w-full" : "max-w-4xl mx-auto",
              borderRadii[borderRadius],
              showBorder && "border border-border",
              aspectRatios[aspectRatio]
            )}
            style={aspectRatio === "auto" ? { height } : undefined}
          >
            {/* Loading Skeleton */}
            {!isLoaded && (
              <div className="absolute inset-0 bg-muted animate-pulse" />
            )}

            <iframe
              src={embedUrl}
              className="w-full h-full border-0"
              loading="lazy"
              allowFullScreen
              onLoad={() => setIsLoaded(true)}
              title={title || "Embedded content"}
            />
          </motion.div>
        </div>
      </section>
    );
  }

  // Render video embed (YouTube, Vimeo)
  if (embedType === "video" && embedUrl) {
    // Convert YouTube/Vimeo URLs to embed URLs
    let videoEmbedUrl = embedUrl;

    // YouTube
    const youtubeMatch = embedUrl.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/
    );
    if (youtubeMatch) {
      videoEmbedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Vimeo
    const vimeoMatch = embedUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) {
      videoEmbedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return (
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          {title && (
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold tracking-tight mb-8 text-center"
            >
              {title}
            </motion.h2>
          )}

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={cn(
              "relative overflow-hidden aspect-video",
              fullWidth ? "w-full" : "max-w-4xl mx-auto",
              borderRadii[borderRadius],
              showBorder && "border border-border"
            )}
          >
            {!isLoaded && (
              <div className="absolute inset-0 bg-muted animate-pulse" />
            )}

            <iframe
              src={videoEmbedUrl}
              className="w-full h-full border-0"
              loading="lazy"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              onLoad={() => setIsLoaded(true)}
              title={title || "Video"}
            />
          </motion.div>
        </div>
      </section>
    );
  }

  // Render HTML embed
  if (embedType === "html" && code) {
    return (
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          {title && (
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold tracking-tight mb-8 text-center"
            >
              {title}
            </motion.h2>
          )}

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={cn(
              fullWidth ? "w-full" : "max-w-4xl mx-auto",
              borderRadii[borderRadius],
              showBorder && "border border-border p-6"
            )}
          >
            <div
              ref={containerRef}
              className="embed-content"
              style={aspectRatio === "auto" ? { minHeight: height } : undefined}
            />
          </motion.div>
        </div>
      </section>
    );
  }

  // Fallback - empty state
  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <div
          className={cn(
            "flex items-center justify-center text-muted-foreground",
            "border-2 border-dashed border-border",
            borderRadii[borderRadius]
          )}
          style={{ height }}
        >
          <p>Chưa có nội dung embed. Vui lòng cấu hình URL hoặc HTML code.</p>
        </div>
      </div>
    </section>
  );
}
