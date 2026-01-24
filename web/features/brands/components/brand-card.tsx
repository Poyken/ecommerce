"use client";


import { NavCard } from "@/components/shared/nav-card";

interface BrandCardProps {
  id: string;
  name: string;
  count?: number;
  imageUrl?: string;
  className?: string;
}

export function BrandCard({
  id,
  name,
  count,
  imageUrl,
  className,
}: BrandCardProps) {
  return (
    <NavCard
      href={`/brands/${id}`}
      name={name}
      count={count}
      imageUrl={imageUrl}
      variant="brand"
      className={className}
    />
  );
}
