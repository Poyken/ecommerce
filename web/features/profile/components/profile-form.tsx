

"use client";

import { ProfileAccountTab } from "@/features/profile/components/profile-account-tab";
import { ProfileAddressesTab } from "@/features/profile/components/profile-addresses-tab";
import { ProfileBlogsTab } from "@/features/profile/components/profile-blogs-tab";
import { ProfileDashboardTab } from "@/features/profile/components/profile-dashboard-tab";
import { ProfileOrdersTab } from "@/features/profile/components/profile-orders-tab";
import { ProfilePasswordTab } from "@/features/profile/components/profile-password-tab";
import { ProfileSecurityTab } from "@/features/profile/components/profile-security-tab";
import { ProfileSidebar } from "@/features/profile/components/profile-sidebar";
import { ProfileVouchersTab } from "@/features/profile/components/profile-vouchers-tab";
import { ProfileWishlistTab } from "@/features/profile/components/profile-wishlist-tab";
import { ProfileReturnsTab } from "@/features/profile/components/profile-returns-tab";
import { User } from "@/types/models";
import { m } from "@/lib/animations";
import { AnimatePresence } from "framer-motion";
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
      case "returns":
        return <ProfileReturnsTab />;
      case "wishlist":
        return <ProfileWishlistTab />;
      case "addresses":
        return <ProfileAddressesTab addresses={user.addresses || []} />;
      case "vouchers":
        return <ProfileVouchersTab />;
      case "password":
        return <ProfilePasswordTab />;
      case "security":
        return <ProfileSecurityTab user={user} />;
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
          <m.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {renderContent()}
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
