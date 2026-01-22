import { getCouponsAction } from "@/features/admin/actions";
import { getTranslations } from "next-intl/server";
import { CouponsClient } from "./coupons-client";



export default async function CouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; limit?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;

  const result = await getCouponsAction(page, limit, search);
  const t = await getTranslations("admin.coupons");

  if ("error" in result) {
    return (
      <div className="p-6 text-red-500">
        {t("errorLoading")}: {result.error}
      </div>
    );
  }

  return (
    <div className="p-6">
      <CouponsClient initialCoupons={result.data || []} meta={result.meta} />
    </div>
  );
}
