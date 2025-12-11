import { FilterSidebar } from "@/components/filter-sidebar";
import { HeroSection } from "@/components/hero-section";
import { FAQAccordion } from "@/components/home/faq-accordion";
import { TestimonialsCarousel } from "@/components/home/testimonials-carousel";
import { SearchInput } from "@/components/search-input";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassCard } from "@/components/ui/glass-card";
import { http } from "@/lib/http";
import { ArrowRight, ImageIcon, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Types based on API response
interface Product {
  id: string;
  name: string;
  description: string;
  skus: { price: number; imageUrl?: string }[];
  category?: { name: string };
  brand?: { name: string };
}

interface Category {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const categoryId = typeof params.categoryId === "string" ? params.categoryId : undefined;
  const brandId = typeof params.brandId === "string" ? params.brandId : undefined;
  const searchQuery = typeof params.search === "string" ? params.search : undefined;

  // Build query string
  const queryParts = [];
  if (categoryId) queryParts.push(`categoryId=${categoryId}`);
  if (brandId) queryParts.push(`brandId=${brandId}`);
  if (searchQuery) queryParts.push(`search=${searchQuery}`);
  const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

  let products: Product[] = [];
  let categories: Category[] = [];
  let brands: Brand[] = [];

  try {
    const [productsRes, categoriesRes, brandsRes] = await Promise.all([
      http<{ data: { items: Product[] } | Product[] }>(`/products${queryString}`),
      http<{ data: Category[] }>("/categories"),
      http<{ data: Brand[] }>("/brands"),
    ]);

    // Handle products response
    if ("items" in productsRes.data) {
      products = productsRes.data.items;
    } else if (Array.isArray(productsRes.data)) {
      products = productsRes.data;
    }

    // Handle categories response
    if (Array.isArray(categoriesRes.data)) {
      categories = categoriesRes.data;
    }

    // Handle brands response
    if (Array.isArray(brandsRes.data)) {
      brands = brandsRes.data;
    }
  } catch (e) {
    console.error("Failed to fetch data", e);
  }

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30">
      <HeroSection />

      <main className="container mx-auto px-4 py-12 space-y-24">
        {/* 1. Trending Now (Hook) */}
        <section>
           <div className="flex items-center gap-2 mb-8 animate-in slide-in-from-bottom-4 duration-700">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <h2 className="text-2xl font-bold tracking-tight">Trending Now</h2>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {products.slice(0, 4).map((product, i) => (
                  <Link key={`trend-${product.id}`} href={`/products/${product.id}`} className="block h-full">
                      <GlassCard className="p-5 h-full group hover:bg-white/5 hover:border-primary/20 transition-all duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                          <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-4 bg-muted/20">
                              {product.skus?.[0]?.imageUrl && (
                                  <Image 
                                    src={product.skus[0].imageUrl} 
                                    alt={product.name} 
                                    fill 
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                  />
                              )}
                              <div className="absolute top-2 left-2 bg-primary text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                                HOT
                              </div>
                          </div>
                          <h3 className="font-medium truncate group-hover:text-primary transition-colors">{product.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {product.skus?.[0]?.price ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(product.skus[0].price)) : "Contact"}
                          </p>
                      </GlassCard>
                  </Link>
              ))}
           </div>
        </section>

        {/* 2. Shop by Category (Discovery) */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Shop by Category</h2>
            <Link href="/?category=all" className="text-sm font-medium text-primary hover:underline underline-offset-4">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.slice(0, 4).map((cat, i) => (
               <Link key={cat.id} href={`/?categoryId=${cat.id}`} className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-900 border border-white/5 shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                  <Image 
                    src={`https://placehold.co/600x400/1e293b/FFF?text=${cat.name}`} 
                    alt={cat.name} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out-expo" 
                  />
                  <div className="absolute bottom-4 left-4 z-20">
                     <h3 className="text-white font-bold text-lg group-hover:text-primary transition-colors">{cat.name}</h3>
                     <p className="text-white/60 text-xs">Explore Collection</p>
                  </div>
               </Link>
            ))}
          </div>
        </section>

        {/* 3. Why Choose Us (Trust) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
                { title: "Premium Quality", desc: "Sourced from the finest materials worldwide.", icon: "✨" },
                { title: "Secure Payment", desc: "100% secure payment with major providers.", icon: "🔒" },
                { title: "Express Delivery", desc: "Fast and reliable shipping to your doorstep.", icon: "🚀" },
            ].map((item, i) => (
                <GlassCard key={i} className="p-8 text-center space-y-4 hover:bg-white/5 hover:border-primary/20 transition-all duration-300">
                    <div className="text-4xl mb-4">{item.icon}</div>
                    <h3 className="text-xl font-bold">{item.title}</h3>
                    <p className="text-muted-foreground">{item.desc}</p>
                </GlassCard>
            ))}
        </section>

        {/* 4. Promotional Banner (Engagement) */}
        <section className="relative h-[400px] rounded-3xl overflow-hidden border border-white/5 shadow-2xl group">
             <Image 
                src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2670&auto=format&fit=crop" 
                alt="Promo"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
             />
             <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
             <div className="absolute inset-0 flex items-center p-8 md:p-16">
                <div className="max-w-md space-y-6">
                    <span className="text-primary font-bold tracking-widest uppercase text-sm">Limited Time Offer</span>
                    <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                        Mid-Season <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-white">Exclusive Sale</span>
                    </h2>
                    <p className="text-white/80 text-lg">
                        Up to 50% off on selected premium items. Upgrade your wardrobe with our signature collection.
                    </p>
                    <GlassButton size="lg" className="mt-4">
                        Shop Sale
                    </GlassButton>
                </div>
             </div>
        </section>

        {/* 5. Curated Collection (Core) */}
        <section id="collection" className="space-y-12">
             <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/10 pb-8">
              <div className="space-y-2">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Curated Collection</h2>
                <p className="text-muted-foreground text-lg">Discover our hand-picked premium items.</p>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                 <SearchInput />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Filters Sidebar */}
              <FilterSidebar categories={categories} brands={brands} />

              {/* Product Grid */}
              <div className="lg:col-span-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {products.length > 0 ? (
                    products.map((product) => (
                      <GlassCard
                        key={product.id}
                        variant="hover"
                        className="group flex flex-col h-full rounded-2xl border-white/10 hover:border-primary/20 aspect-[4/5]"
                      >
                        <Link
                          href={`/products/${product.id}`}
                          className="flex-grow flex flex-col"
                        >
                          <div className="relative w-full aspect-[4/5] bg-neutral-900/50 overflow-hidden">
                            {product.skus?.[0]?.imageUrl ? (
                              <Image
                                src={product.skus[0].imageUrl}
                                alt={product.name}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out-expo"
                              />
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/30">
                                <ImageIcon size={48} strokeWidth={1} />
                                <span className="text-xs mt-2 font-medium">
                                  No Image
                                </span>
                              </div>
                            )}
                            
                            {/* Tags */}
                            <div className="absolute top-3 left-3 flex flex-col gap-2">
                               <div className="bg-background/80 backdrop-blur-md text-foreground text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-bold shadow-sm border border-white/10">
                                New
                              </div>
                            </div>

                            {/* Quick Add Overlay */}
                            <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out-expo bg-gradient-to-t from-black/80 to-transparent pt-12">
                               <GlassButton size="sm" className="w-full bg-white text-black hover:bg-white/90 border-none shadow-xl">
                                 Quick View
                               </GlassButton>
                            </div>
                          </div>
                          
                          <div className="p-5 flex-grow flex flex-col gap-2">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">
                                    {product.brand?.name}
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                    {product.name}
                                    </h3>
                                </div>
                                <p className="text-lg font-bold text-primary whitespace-nowrap">
                                {product.skus?.[0]?.price &&
                                Number(product.skus[0].price) > 0
                                    ? new Intl.NumberFormat("vi-VN", {
                                        style: "currency",
                                        currency: "VND",
                                    }).format(Number(product.skus[0].price))
                                    : "Contact"}
                                </p>
                            </div>
                            
                            <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed mt-1">
                              {product.description}
                            </p>
                          </div>
                        </Link>
                      </GlassCard>
                    ))
                  ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-32 text-muted-foreground bg-white/5 rounded-3xl border border-white/5 border-dashed">
                      <Search size={48} className="text-white/20 mb-4" />
                      <p className="text-xl font-medium text-foreground">No products found</p>
                      <p className="text-sm mt-2">Try adjusting your filters or search query.</p>
                      <Link href="/" className="mt-6">
                        <GlassButton variant="secondary">Clear Filters</GlassButton>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
        </section>

        {/* 6. Customer Stories (Social Proof) */}
        <section>
            <h2 className="text-3xl font-bold text-center mb-12">Stories from our Community</h2>
            <TestimonialsCarousel />
        </section>

        {/* 7. The Journal (Content) */}
        <section>
            <div className="flex justify-between items-end mb-8">
                <h2 className="text-3xl font-bold">The Journal</h2>
                <Link href="#" className="text-primary hover:underline underline-offset-4">Read All Articles</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="group relative aspect-video rounded-2xl overflow-hidden border border-white/10">
                    <Image src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2670&auto=format&fit=crop" alt="Blog 1" fill className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out-expo" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex items-end p-8">
                        <div>
                            <div className="text-xs font-bold text-primary mb-2 uppercase">Style Guide</div>
                            <h3 className="text-2xl font-bold text-white">Essential Wardrobe Staples for 2025</h3>
                        </div>
                    </div>
               </div>
               <div className="space-y-4">
                   {[
                       { title: "Behind the Design: The Summer Collection", date: "Oct 12, 2024" },
                       { title: "Sustainable Fashion: Our Commitment", date: "Sep 28, 2024" },
                       { title: "5 Ways to Style Your Accessories", date: "Sep 15, 2024" }
                   ].map((article, i) => (
                       <GlassCard key={i} className="p-6 flex items-center justify-between group cursor-pointer hover:bg-white/10 hover:border-primary/20 transition-all duration-300">
                            <div>
                                <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{article.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{article.date}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                                <ArrowRight size={14} />
                            </div>
                       </GlassCard>
                   ))}
               </div>
            </div>
        </section>

        {/* 8. FAQ (Support) */}
        <section className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <FAQAccordion />
        </section>

        {/* 9. Newsletter - At Bottom */}
        <section className="relative rounded-3xl border border-black/5 dark:border-white/5 overflow-hidden bg-white/60 dark:bg-white/5 p-8 md:p-16 text-center backdrop-blur-md shadow-sm">
             <div className="absolute top-0 right-0 -m-16 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
             <div className="absolute bottom-0 left-0 -m-16 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px]" />
             
             <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                 <h2 className="text-3xl font-bold text-foreground">Join the Exclusive Club</h2>
                 <p className="text-muted-foreground text-lg">
                     Subscribe to receive updates, access to exclusive deals, and more.
                 </p>
                 <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                     <input 
                        type="email" 
                        placeholder="Enter your email" 
                        className="flex-1 bg-black/5 dark:bg-black/20 border-black/10 dark:border-white/10 text-foreground placeholder:text-muted-foreground rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                     />
                     <GlassButton size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-lg shadow-primary/20">Subscribe</GlassButton>
                 </div>
             </div>
        </section>


      </main>
    </div>
  );
}
