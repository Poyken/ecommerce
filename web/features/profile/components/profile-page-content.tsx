"use client";

import { ProfileForm } from "@/components/organisms/profile-form";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { User } from "@/types/models";
import { motion } from "framer-motion";

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
 * - Wrap `ProfileForm` bên trong một container có `max-w-4xl` để đảm bảo form không bị quá rộng trên màn hình lớn.
 * =====================================================================
 */

interface ProfilePageContentProps {
  user: User;
}

export function ProfilePageContent({ user }: ProfilePageContentProps) {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30 pt-24 pb-12 relative overflow-hidden">
      {/* Ambient Background - Luxe Theme */}
      <div className="fixed inset-0 bg-linear-to-br from-primary/5 via-accent/5 to-primary/5 -z-20" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[150px] -z-10" />
      <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[180px] -translate-x-1/2 -translate-y-1/2 -z-10" />
      <motion.div
        className="container mx-auto px-4 max-w-7xl"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div className="mb-10" variants={fadeInUp}>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              Account Settings
            </h1>
            <p className="text-muted-foreground/70 mt-2 text-sm md:text-base font-medium">
              Manage your profile and preferences
            </p>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <ProfileForm user={user} />
        </motion.div>
      </motion.div>
    </div>
  );
}
