import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Account - EcoSaaS',
  description: 'Manage your account, orders, and preferences',
};

/**
 * Customer Layout - Storefront and account pages
 * Includes: Shop, Products, Cart, Checkout, Account (Profile, Orders, Wishlist)
 */
export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="customer-layout">
      {/* Customer storefront layout */}
      {children}
    </div>
  );
}
