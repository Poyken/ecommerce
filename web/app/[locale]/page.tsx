import { headers } from "next/headers";
import ShopLayout from "./(shop)/layout";
import ShopPage from "./(shop)/page";
import MarketingLayout from "./(marketing)/layout";
import MarketingPage from "./(marketing)/landing/page";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost";
  const { locale } = await params;

  // Domain Logic
  // Marketing Domains: luxesaas.com, platform, marketing, localhost (default)
  // Tenant Domains: demo.local, store1.luxesaas.com, etc.
  const isMarketingDomain =
    host.includes("luxesaas.com") ||
    host.includes("platform") ||
    host.includes("marketing") ||
    (!host.includes(".") && host !== "localhost") || // Localhost usually dev, treated as Marketing?
    host.startsWith("localhost"); // Let's treat localhost as Marketing based on user request "/ is marketing"

  // User said "demo.local" is tenant. So if host has "local" but not "localhost"?
  // Or "demo.local" is distinct.
  // Exception: If we want to test Shop on localhost?
  // User said "tenant demo ... /demo/ ... tenant ... demo.local".
  // So localhost is likely Marketing.

  // To be safe, if explicitly 'demo.local', it's tenant.
  // If 'localhost', it's marketing.

  // Refined Logic:
  const isTenant = !isMarketingDomain && !host.includes("www.luxesaas.com"); // Simplify

  // Actually, user said "/ chính là marketing".
  // I will use the whitelist approach for Marketing keywords.
  const marketingKeywords = ["luxesaas", "platform", "marketing", "localhost", "vercel"];
  const isMarketing = marketingKeywords.some(keyword => host.includes(keyword)) && !host.includes("demo.local");

  if (isMarketing) {
    return (
      <MarketingLayout>
        <MarketingPage />
      </MarketingLayout>
    );
  }

  // Tenant Shop
  return (
    <ShopLayout>
      <ShopPage />
    </ShopLayout>
  );
}
