import { getReviewsAction } from "@/features/admin/actions";
import { ReviewsClient } from "./reviews-client";



async function getReviewCounts() {
  try {
    const [all, published, hidden] = await Promise.all([
      getReviewsAction({ page: 1, limit: 1 }),
      getReviewsAction({ page: 1, limit: 1, status: "published" }),
      getReviewsAction({ page: 1, limit: 1, status: "hidden" }),
    ]);

    return {
      total: "data" in all ? all.meta?.total || 0 : 0,
      published: "data" in published ? published.meta?.total || 0 : 0,
      hidden: "data" in hidden ? hidden.meta?.total || 0 : 0,
    };
  } catch (error) {
    // console.error("Error fetching review counts:", error);
    return {
      total: 0,
      published: 0,
      hidden: 0,
    };
  }
}

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const search = (params?.search as string) || "";
  const status = (params?.status as string) || "all";

  const [response, counts] = await Promise.all([
    getReviewsAction({ page, limit: 10, search, status }),
    getReviewCounts(),
  ]);

  if ("error" in response) {
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
      counts={counts}
      currentStatus={status}
    />
  );
}
