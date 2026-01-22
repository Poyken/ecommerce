import { getPermissionsAction } from "@/features/admin/actions";
import { getTranslations } from "next-intl/server";
import { PermissionsPageClient } from "./permissions-client";



export default async function PermissionsPage() {
  const t = await getTranslations("admin.permissions");
  const result = await getPermissionsAction();

  if (!("data" in result)) {
    return (
      <div className="p-8">
        <div className="text-red-600 bg-red-50 border border-red-200 rounded p-4">
          <h2 className="font-bold mb-2">{t("errorLoading")}</h2>
          <p>{(result as any).error}</p>
        </div>
      </div>
    );
  }

  const permissions = result.data;

  return <PermissionsPageClient permissions={permissions || []} />;
}
