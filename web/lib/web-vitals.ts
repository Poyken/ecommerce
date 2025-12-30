/**
 * Web Vitals Monitoring - Track Core Web Vitals
 * Sends metrics to analytics for monitoring LCP, FID, CLS, FCP, TTFB
 */

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

interface Metric {
  id: string;
  name: string;
  startTime: number;
  value: number;
  label: "web-vital" | "custom";
  delta: number;
}

import { savePerformanceMetricAction } from "@/features/analytics/actions";

export function reportWebVitals(metric: Metric) {
  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log("[Web Vitals]", metric);
  }

  // [P17 OPTIMIZATION] Send to internal analytics
  // Convert value to a rating based on standard thresholds
  let rating = "good";
  if (metric.name === "CLS") {
    if (metric.value > 0.25) rating = "poor";
    else if (metric.value > 0.1) rating = "needs-improvement";
  } else if (metric.name === "LCP") {
    if (metric.value > 4000) rating = "poor";
    else if (metric.value > 2500) rating = "needs-improvement";
  } else if (metric.name === "FID") {
    if (metric.value > 300) rating = "poor";
    else if (metric.value > 100) rating = "needs-improvement";
  }

  savePerformanceMetricAction({
    name: metric.name,
    value: metric.value,
    rating,
    url: typeof window !== "undefined" ? window.location.href : "unknown",
  });

  // Send to Google Analytics if available
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", metric.name, {
      value: Math.round(
        metric.name === "CLS" ? metric.value * 1000 : metric.value
      ),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
    });
  }
}
