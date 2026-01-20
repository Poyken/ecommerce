import { TenantRegisterPageContent } from "@/features/auth/components/tenant-register-page-content";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Join Shop | Create Account",
  description: "Create your account to start shopping.",
};

export default function TenantRegisterPage() {
  return (
    <Suspense>
      <TenantRegisterPageContent />
    </Suspense>
  );
}
