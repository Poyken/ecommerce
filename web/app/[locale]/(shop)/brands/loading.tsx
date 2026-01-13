import { BrandsSkeleton } from "@/features/home/components/skeletons/home-skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <BrandsSkeleton />
    </div>
  );
}
