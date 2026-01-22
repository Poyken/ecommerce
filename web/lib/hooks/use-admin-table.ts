"use client";

import { useDebounce } from "@/lib/hooks/use-debounce";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";


export function useAdminTable(baseUrl: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Search state
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  // Sync Search with URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentSearch = params.get("search") || "";

    if (currentSearch !== debouncedSearchTerm) {
      startTransition(() => {
        if (debouncedSearchTerm) {
          params.set("search", debouncedSearchTerm);
        } else {
          params.delete("search");
        }
        params.set("page", "1"); // Reset to page 1 on search
        router.push(`${baseUrl}?${params.toString()}` as any);
      });
    }
  }, [debouncedSearchTerm, router, searchParams, baseUrl]);

  /**
   * Chuyển đổi bộ lọc (thường là Tabs cho status)
   */
  const handleFilterChange = (key: string, value: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.set("page", "1"); // Reset to page 1 on filter change
      router.push(`${baseUrl}?${params.toString()}` as any);
    });
  };

  /**
   * Chuyển trang
   */
  const handlePageChange = (page: number) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());
      router.push(`${baseUrl}?${params.toString()}` as any);
    });
  };

  return {
    searchTerm,
    setSearchTerm,
    isPending,
    handleFilterChange,
    handlePageChange,
  };
}
