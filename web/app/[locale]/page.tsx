import { headers } from "next/headers";
import ShopLayout from "./(customer)/layout";
import ShopPage from "./(customer)/shop/page";
import MarketingLayout from "./(platform)/layout";
import MarketingPage from "./(platform)/landing/page";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost";
  const { locale } = await params;

  // Domain Logic
  const marketingKeywords = ["luxesaas", "platform", "marketing", "localhost", "vercel"];
  // If localhost is used for Shop testing, we might need a specific check.
  // For now, consistent with previous logic: localhost = marketing unless it's demo.localhost
  const isMarketing = marketingKeywords.some(keyword => host.includes(keyword)) && !host.includes("demo");

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
      <ShopPage searchParams={searchParams} />
    </ShopLayout>
  );
}
