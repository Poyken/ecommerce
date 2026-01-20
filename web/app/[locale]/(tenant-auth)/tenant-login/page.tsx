import { TenantLoginPageContent } from "@/features/auth/components/tenant-login-page-content";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Shop Sign In | Experience Modern Living",
  description: "Access your shop account.",
};

export default function TenantLoginPage() {
  return (
    <Suspense>
      <TenantLoginPageContent />
    </Suspense>
  );
}
