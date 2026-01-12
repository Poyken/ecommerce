"use client";

import { useEffect } from "react";

export function PwaProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.workbox === undefined // Avoid double registration if using workbox
    ) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("SW registered: ", registration.scope);
          })
          .catch((err) => {
            console.error("SW registration failed: ", err);
          });
      });
    }
  }, []);

  return <>{children}</>;
}
