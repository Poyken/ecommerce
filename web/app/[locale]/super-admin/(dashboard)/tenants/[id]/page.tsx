

import { getTenantAction } from "@/features/admin/actions";
import { TenantDetailClient } from "./tenant-detail-client";

interface PageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export default async function TenantDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getTenantAction(id);

  if (result.error || !result.data) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-bold text-red-600">Error</h2>
        <p className="text-muted-foreground">
          {result.error || "Tenant not found"}
        </p>
      </div>
    );
  }

  return <TenantDetailClient tenant={result.data} />;
}
