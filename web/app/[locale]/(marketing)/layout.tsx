import type { Metadata } from "next";
import { MarketingLayout } from "./marketing-layout-client";

export const metadata: Metadata = {
  title: "Luxe SaaS | Multi-tenant E-commerce Platform",
  description:
    "Create your own online store in just 30 seconds. Built-in AI, Multi-warehouse Management and B2B Wholesale. Complete Multi-tenant SaaS solution.",
  openGraph: {
    title: "Luxe SaaS | Multi-tenant E-Commerce Platform",
    description:
      "Create your own online store in just 30 seconds. Built-in AI, Multi-warehouse Management and B2B Wholesale.",
    type: "website",
    images: ["/og-marketing.jpg"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <MarketingLayout>{children}</MarketingLayout>;
}
