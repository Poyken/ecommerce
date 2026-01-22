"use client";

import { ReactNode } from "react";

interface HomeWrapperProps {
  children: ReactNode;
}


export function HomeWrapper({ children }: HomeWrapperProps) {
  // Use translations if needed for aria-labels, but mostly for background

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-accent/30 relative overflow-hidden transition-colors duration-500">
      {/* Cinematic Background & Aurora Glow */}
      <div className="fixed inset-0 bg-cinematic pointer-events-none z-0 opacity-40" />
      <div className="fixed top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-(--aurora-blue)/15 rounded-full blur-[150px] animate-pulse-glow z-0 pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-(--aurora-purple)/15 rounded-full blur-[150px] animate-float z-0 pointer-events-none" />

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
