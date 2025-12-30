"use client";

import { initPerformanceMonitor } from "@/lib/performance-monitor";
import { useEffect } from "react";

export function PerformanceTracker() {
  useEffect(() => {
    initPerformanceMonitor();
  }, []);

  return null;
}
