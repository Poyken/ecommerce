import { getReviewsAction } from "@/actions/admin";
import { ReviewsClient } from "./reviews-client";

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const limit = parseInt(params.limit || "10", 10);

  const result = await getReviewsAction(page, limit);

  if (result.error) {
    return (
      <div className="p-8">
        <div className="text-red-600 bg-red-50 border border-red-200 rounded p-4">
          <h2 className="font-bold mb-2">Error loading reviews</h2>
          <p>{result.error}</p>
        </div>
      </div>
    );
  }

  return (
    <ReviewsClient
      reviews={result.data || []}
      total={result.meta?.total || 0}
      page={page}
      limit={limit}
    />
  );
}
