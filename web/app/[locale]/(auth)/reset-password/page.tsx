import { ResetPasswordPageContent } from "@/features/auth/components/reset-password-page-content";
import { Metadata } from "next";
import { Suspense } from "react";



export const metadata: Metadata = {
  title: "Reset Password | Luxe",
  description: "Create a new password for your Luxe account.",
};

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordPageContent key="reset-password" />
    </Suspense>
  );
}
