import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EcoSaaS Platform',
  description: 'The all-in-one SaaS platform for multi-tenant ecommerce',
};

/**
 * Platform Layout - Public marketing pages
 * Includes: Landing, Pricing, Features, About, Contact
 */
export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="platform-layout">
      {/* Platform-specific layout wrapper if needed */}
      {children}
    </div>
  );
}
