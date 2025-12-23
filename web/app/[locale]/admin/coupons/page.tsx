import { getCouponsAction } from "@/actions/admin";
import { getTranslations } from "next-intl/server";
import { CouponsClient } from "./coupons-client";

export default async function CouponsPage() {
  const result = await getCouponsAction();
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
      <CouponsClient initialCoupons={result.data || []} />
    </div>
  );
}
