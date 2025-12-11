"use client";

import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { GlassButton } from "./ui/glass-button";

interface Category {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

interface FilterSidebarProps {
  categories: Category[];
  brands: Brand[];
}

export function FilterSidebar({ categories, brands }: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const createQueryString = useCallback(
    (name: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null) {
        params.delete(name);
      } else {
        params.set(name, value);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleFilter = (type: "categoryId" | "brandId", value: string | null) => {
    startTransition(() => {
        const queryString = createQueryString(type, value);
        router.replace(`${pathname}?${queryString}`, { scroll: false });
    });
  };

  const currentCategory = searchParams.get("categoryId");
  const currentBrand = searchParams.get("brandId");

  return (
    <aside className="hidden lg:block lg:col-span-1 space-y-8 sticky top-24 h-fit">
      <div className="space-y-4">
        <h3 className="font-semibold text-lg tracking-tight">Categories</h3>
        <div className="space-y-2">
          <button
            onClick={() => handleFilter("categoryId", null)}
            className={cn(
              "block w-full text-left text-sm px-3 py-2 rounded-md transition-colors",
              !currentCategory
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5",
              isPending && "opacity-70"
            )}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleFilter("categoryId", cat.id)}
              className={cn(
                "block w-full text-left text-sm px-3 py-2 rounded-md transition-colors",
                currentCategory === cat.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                 isPending && "opacity-70"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg tracking-tight">Brands</h3>
        <div className="space-y-2">
          <button
             onClick={() => handleFilter("brandId", null)}
            className={cn(
              "block w-full text-left text-sm px-3 py-2 rounded-md transition-colors",
              !currentBrand
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5",
              isPending && "opacity-70"
            )}
          >
            All Brands
          </button>
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => handleFilter("brandId", brand.id)}
              className={cn(
                "block w-full text-left text-sm px-3 py-2 rounded-md transition-colors",
                currentBrand === brand.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                isPending && "opacity-70"
              )}
            >
              {brand.name}
            </button>
          ))}
        </div>
      </div>
      
       {/* Reset All */}
       {(currentCategory || currentBrand) && (
            <GlassButton 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs text-muted-foreground hover:text-destructive"
                onClick={() => {
                    startTransition(() => {
                        router.replace(pathname, { scroll: false });
                    });
                }}
            >
                Reset All Filters
            </GlassButton>
       )}
    </aside>
  );
}
