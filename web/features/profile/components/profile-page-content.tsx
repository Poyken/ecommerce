"use client";

import { ProfileForm } from "@/features/profile/components/profile-form";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { User } from "@/types/models";
import { m } from "@/lib/animations";

/**
 * =====================================================================
 * PROFILE PAGE CONTENT - Layout trang cá nhân
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. AMBIENT BACKGROUND:
 * - Sử dụng các lớp `div` tuyệt đối với `blur-[100px]` để tạo hiệu ứng ánh sáng nền mờ ảo (Glow effect).
 * - Tạo cảm giác không gian hiện đại và cao cấp cho trang Profile.
 *
 * 2. ANIMATION VARIANTS:
 * - Sử dụng các animation variants từ `@/lib/animations` thay vì inline.
 * - Giúp code sạch hơn và dễ maintain hơn.
 *
 * 3. COMPONENT COMPOSITION:
 * - Wrap `ProfileForm` bên trong một container có `max-w-4xl` để đảm bảo form không bị quá rộng trên màn hình lớn. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

interface ProfilePageContentProps {
  user: User;
}

export function ProfilePageContent({ user }: ProfilePageContentProps) {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-accent/30 pt-32 pb-24 relative overflow-hidden">
      {/* Cinematic Background & Aurora Glow */}
      <div className="fixed inset-0 bg-cinematic pointer-events-none z-0 opacity-40" />
      <div className="fixed top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-(--aurora-purple)/15 rounded-full blur-[150px] animate-pulse-glow z-0 pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-(--aurora-blue)/15 rounded-full blur-[150px] animate-float z-0 pointer-events-none" />

      <m.div
        className="container relative mx-auto px-4 md:px-8 max-w-7xl z-10"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <m.div className="mb-16 space-y-6" variants={fadeInUp}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-premium border border-white/10 text-accent text-[10px] font-black uppercase tracking-[0.3em]">
             <div className="size-1.5 rounded-full bg-accent animate-pulse" />
             <span>User Account</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter uppercase leading-none bg-clip-text text-transparent bg-linear-to-b from-white to-white/40">
            <span className="block">Account Settings</span>
            <span className="font-serif italic font-normal text-muted-foreground/60 block mt-4 normal-case tracking-tight">Personal Workspace</span>
          </h1>
          <p className="text-xl text-muted-foreground/80 font-medium max-w-xl">
            Manage your profile, security settings and preferences
          </p>
        </m.div>

        <m.div variants={fadeInUp} className="relative z-10">
          <ProfileForm user={user} />
        </m.div>
      </m.div>
    </div>
  );
}
