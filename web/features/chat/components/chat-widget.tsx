"use client";

import { useToast } from "@/components/shared/use-toast";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useState } from "react";

/**
 * =====================================================================
 * CHAT WIDGET - Floating Chat Button
 * =====================================================================
 * Replaces the Floating Cart on the Home Page.
 * Positioned Bottom-Left as requested.
 */
export function ChatWidget() {
  const [isVisible, setIsVisible] = useState(true);
  const { toast } = useToast();

  const handleClick = () => {
    toast({
      title: "Chat Support",
      description: "Live chat system is under development.",
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          data-fixed-element
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          onClick={handleClick}
          className={cn(
            "fixed bottom-6 right-6 z-50", // Positioned Bottom-Right
            "lg:bottom-8 lg:right-8",
            "group"
          )}
        >
          <div
            className={cn(
              "relative flex items-center justify-center",
              "w-14 h-14 lg:w-16 lg:h-16 rounded-full",
              "bg-foreground/5 backdrop-blur-md border border-white/10 dark:border-white/5", // Glass effect manual fallback if class missing
              "hover:bg-primary hover:text-primary-foreground", // Hover effect
              "text-foreground shadow-2xl shadow-black/10",
              "transition-all duration-500 ease-[0.16,1,0.3,1]",
              "hover:scale-110"
            )}
          >
            <MessageCircle
              className={cn(
                "w-6 h-6 lg:w-7 lg:h-7",
                "transition-transform duration-300",
                "group-hover:scale-110 group-hover:-rotate-12"
              )}
            />
            
            {/* Status Indicator */}
            <span className="absolute top-0 right-0 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
