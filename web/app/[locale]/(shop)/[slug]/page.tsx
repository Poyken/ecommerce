import { BlockData, BlockRenderer } from "@/components/cms/block-renderer";
import { HomeWrapper } from "@/features/home/components/home-wrapper";
import { productService } from "@/services/product.service";
import { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

async function getPageConfig(slug: string): Promise<any | null> {
  try {
    const headersList = await headers();
    const host = headersList.get("host") || "localhost";
    const apiUrl =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:8080/api/v1";

    const res = await fetch(`${apiUrl}/pages/${slug}`, {
      headers: { "x-tenant-domain": host },
      next: { revalidate: 60 },
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.data || json;
  } catch (err) {
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageConfig(slug);

  if (!page) {
    return {
      title: "Page Not Found",
    };
  }

  return {
    title: `${page.title} | Luxe`,
    description: page.metaDescription,
  };
}

export default async function DynamicCMSPage({ params }: PageProps) {
  const { slug } = await params;

  // 1. Fetch CMS Config
  const cmsPage = await getPageConfig(slug);

  if (!cmsPage || !cmsPage.blocks || cmsPage.blocks.length === 0) {
    notFound();
  }

  // 2. Initiate Data Fetches (Non-blocking context for products/categories blocks)
  const productsPromise = productService.getFeaturedProducts(20);
  const categoriesPromise = productService.getCategories();
  const brandsPromise = productService.getBrands();

  const dataContext = {
    products: productsPromise,
    categories: categoriesPromise,
    brands: brandsPromise,
  };

  return (
    <HomeWrapper>
      <div className="flex flex-col gap-0">
        {cmsPage.blocks.map((block: BlockData) => (
          <BlockRenderer key={block.id} block={block} data={dataContext} />
        ))}
      </div>
    </HomeWrapper>
  );
}
