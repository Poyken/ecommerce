

import { getSubscriptionsAction } from "@/features/admin/actions";
import { SubscriptionsClient } from "./subscriptions-client";

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams?.page) || 1;
  const limit = Number(resolvedParams?.limit) || 10;
  const search = (resolvedParams?.search as string) || "";
  
  const statusParam = resolvedParams?.status as string;
  const status = ["active", "cancelled", "expired"].includes(statusParam) 
    ? (statusParam as "active" | "cancelled" | "expired") 
    : undefined;

  const res = await getSubscriptionsAction({
    page,
    limit,
    search,
    status,
  });

  if (res.error) {
    return (
      <div className="p-8 text-red-600 bg-red-50 rounded-lg">
        <h2 className="font-bold">Error loading subscriptions</h2>
        <p>{res.error}</p>
      </div>
    );
  }

  const data = res.data || [];
  const total = res.meta?.total || 0;
  const currentPage = res.meta?.page || 1;
  const currentLimit = res.meta?.limit || 10;

  return (
    <SubscriptionsClient
      subscriptions={data}
      total={total}
      page={currentPage}
      limit={currentLimit}
    />
  );
}
