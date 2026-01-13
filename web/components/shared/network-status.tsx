"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function NetworkStatus() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    function onOffline() {
      setIsOffline(true);
    }

    function onOnline() {
      setIsOffline(false);
    }

    if (typeof window !== "undefined") {
      window.addEventListener("offline", onOffline);
      window.addEventListener("online", onOnline);

      // Initial check
      setIsOffline(!window.navigator.onLine);

      return () => {
        window.removeEventListener("offline", onOffline);
        window.removeEventListener("online", onOnline);
      };
    }
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 z-[100] animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-black text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-white/10">
        <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center animate-pulse">
          <WifiOff className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-bold">You are offline</p>
          <p className="text-xs text-white/70">
            Check your internet connection.
          </p>
        </div>
      </div>
    </div>
  );
}
