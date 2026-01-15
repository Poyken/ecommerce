import { productService } from "@/features/products/services/product.service";
import { CollectionContent } from "@/features/products/components/collection-content";
import { getTranslations } from "next-intl/server";

export async function generateStaticParams() {
  try {
    const ids = await productService.getBrandIds();
    if (ids.length === 0) {
      return [{ id: "fallback" }];
    }
    return ids.map((id) => ({ id }));
  } catch (error) {
    console.warn("Failed to generate brand static params:", error);
    return [{ id: "fallback" }];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const products = await productService.getProducts({
    brandId: id,
    limit: 1,
  });

  const brandName = products?.data?.[0]?.brand?.name || "Brand";

  return {
    title: brandName,
    description: `Explore all products from ${brandName}.`,
  };
}

export default async function BrandProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = 20;

  // Parallel fetch: get brand details and products promise
  const [brand, t] = await Promise.all([
    productService.getBrand(id),
    getTranslations("common"),
  ]);

  const productsPromise = productService.getProducts({
    brandId: id,
    limit,
    page,
  });

  const brandName = brand?.name || "Brand";

  return (
    <CollectionContent
      title={brandName}
      collectionLabel={t("luxuryPartners")}
      backLabel={t("backToBrands")}
      backHref="/brands"
      productsPromise={productsPromise.then((res) => ({
        data: res.data || [],
        meta: res.meta || { page: 1, limit: 20, total: 0, lastPage: 1 },
      }))}
      breadcrumbItems={[
        { label: t("brands"), href: "/brands" },
        { label: brandName },
      ]}
    />
  );
}
