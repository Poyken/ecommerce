"use client";

import { m } from "@/lib/animations";
import { AnimatePresence } from "framer-motion";



interface AnimatedErrorProps {
  message?: string;
  className?: string;
}

export function AnimatedError({ message, className = "" }: AnimatedErrorProps) {
  return (
    <AnimatePresence>
      {message && (
        <m.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className={`text-xs text-destructive ${className}`}
        >
          {message}
        </m.p>
      )}
    </AnimatePresence>
  );
}
