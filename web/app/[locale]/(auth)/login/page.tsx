import { LoginPageContent } from "@/features/auth/components/login-page-content";
import { Metadata } from "next";
import { Suspense } from "react";



export const metadata: Metadata = {
  title: "Sign In | Luxe",
  description: "Access your account to manage orders and preferences.",
};

export default function LoginPage() {
  // Force rebuild
  return (
    <Suspense>
      <LoginPageContent key="login" />
    </Suspense>
  );
}
