import { ForgotPasswordPageContent } from "@/features/auth/components/forgot-password-page-content";
import { Metadata } from "next";



export const metadata: Metadata = {
  title: "Forgot Password | Luxe",
  description: "Reset your password to regain access to your account.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordPageContent key="forgot-password" />;
}
