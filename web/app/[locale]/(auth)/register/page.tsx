import { RegisterPageContent } from "@/features/auth/components/register-page-content";
import { Metadata } from "next";



export const metadata: Metadata = {
  title: "Create Account | Luxe",
  description:
    "Join Luxe to access exclusive products and personalized recommendations.",
};

export default function RegisterPage() {
  return <RegisterPageContent key="register" />;
}
