/**
 * =====================================================================
 * SUBSCRIPTIONS MANAGEMENT - QUẢN LÝ GÓI CƯỚC TOÀN HỆ THỐNG
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Trang này giúp Super Admin kiểm soát dòng tiền và trạng thái gói của các Tenant.
 * =====================================================================
 */

import { getSubscriptionsAction } from "@/features/admin/actions";
import { SubscriptionsClient } from "./subscriptions-client";

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Await searchParams in Next.js 15+ convention (though Next 14 is sync mostly, but good practice if params is a Promise in newer canary types, checking project version... next 16.1.1! Yes, searchParams IS a promise in Next 15/16).
  // Wait, in Next 15 searchParams is a promise. In Next 14 it isn't.
  // The package.json showed "next": "^16.1.1".
  // So searchParams is a Promise.

  const resolvedParams = await searchParams;
  const page = Number(resolvedParams?.page) || 1;
  const limit = Number(resolvedParams?.limit) || 10;
  const search = (resolvedParams?.search as string) || "";
  const status = (resolvedParams?.status as string) || "";

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
