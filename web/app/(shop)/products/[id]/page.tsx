import { SocialProofToast } from "@/components/social-proof-toast";
import { http } from "@/lib/http";
import { ArrowLeft } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "./product-detail-client";

interface ProductDetail {
  id: string;
  name: string;
  description: string;
  price: number;
  skus: any[];
  options: any[];
  images?: string[];
  category: { name: string };
  brand: { name: string };
  isNew?: boolean; 
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let product: ProductDetail | null = null;
  try {
    const res = await http<{ data: ProductDetail }>(`/products/${id}`);
    product = res.data;
  } catch (e) {
    console.error(e);
  }

  if (!product) {
    notFound();
  }

  // Ảnh giữ chỗ nếu không có
  const mainImage = product.images?.[0] || product.skus?.[0]?.imageUrl || "https://placehold.co/600x800";
  // Mock additional images for gallery demo
  const images = product.images?.length 
    ? product.images 
    : [mainImage, "https://placehold.co/600x800/1e293b/ffffff?text=Detail+1", "https://placehold.co/600x800/1e293b/ffffff?text=Detail+2"];

  const cookieStore = await cookies();
  const isLoggedIn = !!cookieStore.get("accessToken")?.value;

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30">
      <div className="container mx-auto px-4 md:px-8 py-8 lg:py-12">
        
        {/* Breadcrumb / Back */}
        <div className="mb-6 lg:mb-8">
            <Link href="/" className="group inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mr-3 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                   <ArrowLeft className="h-4 w-4" />
                </div>
                Back to Collection
            </Link>
        </div>

        <ProductDetailClient 
            product={product} 
            initialImages={images} 
            isLoggedIn={isLoggedIn} 
        />
      </div>
      
      <SocialProofToast />
    </div>
  );
}
