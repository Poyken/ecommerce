"use client";

/**
 * Social callback client component - handles OAuth redirect
 */
import { LoadingScreen } from "@/components/shared/loading-screen";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function SocialCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // The backend has already set cookies during the OAuth flow
    // We just need to redirect the user to their destination
    const redirectTo = searchParams.get("redirect") || "/";

    // Small delay to ensure cookies are set
    const timer = setTimeout(() => {
      router.replace(redirectTo as any);
    }, 500);

    return () => clearTimeout(timer);
  }, [router, searchParams]);

  return <LoadingScreen message="Đang xác thực..." />;
}
