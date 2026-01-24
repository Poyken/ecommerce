

import { Metadata } from "next";
import { Suspense } from "react";
import { SocialCallbackClient } from "./social-callback-client";

export const metadata: Metadata = {
  title: "Social Login | Luxe",
};

export default function SocialCallbackPage() {
  return (
    <Suspense>
      <SocialCallbackClient />
    </Suspense>
  );
}
