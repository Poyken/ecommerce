import { getTranslations } from "next-intl/server";
import { CategoriesClient } from "./categories-client";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return {
    title: `${t("browseCategories")} | Luxe`,
    description: "Browse through our expertly crafted categories designed to elevate your living spaces.",
  };
}

export default async function CategoriesPage() {
  const { getCategoriesAction } = await import("@/features/products/actions");
  const categoriesRes = await getCategoriesAction();
  const categories = categoriesRes.success && categoriesRes.data ? categoriesRes.data : [];

  return <CategoriesClient categories={categories} />;
}
