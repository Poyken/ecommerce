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

export function reportWebVitals(metric: Metric) {
  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log("[Web Vitals]", metric);
  }

  // Send to analytics in production
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

  // Can also send to custom analytics endpoint
  if (process.env.NEXT_PUBLIC_ANALYTICS_URL) {
    fetch(process.env.NEXT_PUBLIC_ANALYTICS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metric: metric.name,
        value: metric.value,
        id: metric.id,
        timestamp: Date.now(),
      }),
    }).catch(() => {
      // Silently fail
    });
  }
}
