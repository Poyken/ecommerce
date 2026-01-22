import { getReturnDetailsAction } from "@/features/admin/actions";
import { ReturnDetailClient } from "./return-detail-client";
import { notFound } from "next/navigation";

/**
 * =====================================================================
 * ADMIN RETURN DETAIL PAGE - Chi tiết yêu cầu trả hàng (Server Component)
 * =====================================================================
 */
export default async function AdminReturnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const result = await getReturnDetailsAction(id);

  if (!result.success || !result.data) {
    if (result.error?.includes("not found")) {
      notFound();
    }
    
    return (
      <div className="p-8 text-center bg-red-50 rounded-2xl border-2 border-red-100 animate-in fade-in slide-in-from-bottom-4">
        <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Return Request</h2>
        <p className="text-red-500 font-medium">{result.error || "An unexpected error occurred."}</p>
      </div>
    );
  }

  return <ReturnDetailClient returnRequest={result.data} />;
}
