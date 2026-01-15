"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    workbox: any;
  }
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      !window.workbox
    ) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then(() => {
            // SW registered successfully, no console log needed
          })
          .catch((err) => {
            console.error("SW registration failed: ", err);
          });
      });
    }
  }, []);

  return <>{children}</>;
}
