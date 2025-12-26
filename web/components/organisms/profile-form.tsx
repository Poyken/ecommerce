/**
 * =====================================================================
 * PROFILE FORM - Trang quản lý hồ sơ người dùng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. TAB-BASED NAVIGATION:
 * - Sử dụng state `activeTab` để chuyển đổi giữa các mục: Dashboard, Account, Orders, Wishlist, v.v.
 * - Giúp tổ chức thông tin người dùng một cách khoa học và dễ sử dụng.
 *
 * 2. ANIMATED TRANSITIONS:
 * - Sử dụng `AnimatePresence` và `motion.div` để tạo hiệu ứng trượt khi chuyển đổi giữa các tab.
 *
 * 3. COMPONENT COMPOSITION:
 * - Mỗi tab là một component riêng biệt (ví dụ: `ProfileAccountTab`, `ProfileOrdersTab`) giúp code dễ bảo trì và mở rộng.
 * =====================================================================
 */

"use client";

import { ProfileAccountTab } from "@/features/profile/components/profile-account-tab";
import { ProfileAddressesTab } from "@/features/profile/components/profile-addresses-tab";
import { ProfileBlogsTab } from "@/features/profile/components/profile-blogs-tab";
import { ProfileDashboardTab } from "@/features/profile/components/profile-dashboard-tab";
import { ProfileOrdersTab } from "@/features/profile/components/profile-orders-tab";
import { ProfilePasswordTab } from "@/features/profile/components/profile-password-tab";
import { ProfileSidebar } from "@/features/profile/components/profile-sidebar";
import { ProfileVouchersTab } from "@/features/profile/components/profile-vouchers-tab";
import { ProfileWishlistTab } from "@/features/profile/components/profile-wishlist-tab";
import { User } from "@/types/models";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export function ProfileForm({ user }: { user: User }) {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <ProfileDashboardTab user={user} onTabChange={setActiveTab} />;
      case "account":
        return <ProfileAccountTab user={user} />;
      case "orders":
        return <ProfileOrdersTab />;
      case "wishlist":
        return <ProfileWishlistTab />;
      case "addresses":
        return <ProfileAddressesTab addresses={user.addresses || []} />;
      case "vouchers":
        return <ProfileVouchersTab />;
      case "password":
        return <ProfilePasswordTab />;
      case "blogs":
        return <ProfileBlogsTab />;
      default:
        return <ProfileAccountTab user={user} />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
      {/* Left Sidebar */}
      <div className="lg:col-span-1">
        <ProfileSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          user={user}
        />
      </div>

      {/* Right Content Area */}
      <div className="lg:col-span-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
