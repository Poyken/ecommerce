"use client";



import { NavCard } from "@/components/shared/nav-card";

interface CategoryCardProps {
  id: string;
  name: string;
  count?: number;
  imageUrl?: string;
  className?: string;
}

export function CategoryCard({
  id,
  name,
  count,
  imageUrl,
  className,
}: CategoryCardProps) {
  return (
    <NavCard
      href={`/categories/${id}`}
      name={name}
      count={count}
      imageUrl={imageUrl || "/images/placeholders/category-placeholder.jpg"}
      variant="category"
      className={className}
    />
  );
}
