import { getReviewsAction } from "@/actions/admin";
import { ReviewsClient } from "./reviews-client";

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const search = (params?.search as string) || "";
  
  const response = await getReviewsAction(page, 10, search);
  
  if ('error' in response) {
    return (
      <div className="p-8 text-center text-red-500">
        Error loading reviews: {response.error}
      </div>
    );
  }

  const reviews = response.data || [];
  const total = response.meta?.total || 0;

  return (
    <ReviewsClient 
      reviews={reviews} 
      total={total} 
      page={page} 
      limit={10} 
    />
  );
}
