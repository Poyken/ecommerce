import { getTranslations } from "next-intl/server";
import { BrandsClient } from "./brands-client";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return {
    title: `${t("browseBrands")} | Luxe`,
    description: "Discover our curated selection of world-class design houses and artisans.",
  };
}

export default async function BrandsPage() {
  const { getBrandsAction } = await import("@/features/products/actions");
  const brandsRes = await getBrandsAction();
  const brands = brandsRes.success && brandsRes.data ? brandsRes.data : [];

  return <BrandsClient brands={brands} />;
}
