import { redirect } from "next/navigation";
import { headers } from "next/headers";

/**
 * ROOT LOCALE PAGE - Điều hướng trang gốc
 * 
 * Smart routing based on context:
 * - Marketing subdomain/path -> Landing page
 * - Shop/Customer subdomain -> Shop home page (via (shop) route group)
 */
export default async function LocaleHomePage() {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost";
  
  // If accessing from main marketing domain, show landing
  // Otherwise, rewrite to show shop home page
  const isMarketingDomain = host.includes("luxesaas.com") || 
                            host.includes("platform") ||
                            host.includes("marketing");
  
  if (isMarketingDomain) {
    redirect("/landing");
  }
  
  // For local dev and shop domains, redirect to shop home
  // This will be handled by the (shop) route group's page.tsx
  redirect("/shop");
}
