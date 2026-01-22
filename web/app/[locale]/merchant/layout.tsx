import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Merchant Dashboard - EcoSaaS',
  description: 'Manage your store, products, and orders',
};

/**
 * Merchant Layout - Store admin dashboard
 * Includes: Dashboard, Products, Orders, Inventory, Analytics, Settings
 * 
 * TODO: Add admin sidebar navigation
 */
export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="merchant-layout min-h-screen bg-gray-50">
      {/* TODO: Add AdminSidebar component */}
      <div className="merchant-content">
        {children}
      </div>
    </div>
  );
}
