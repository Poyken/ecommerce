"use client";

import { http } from "@/lib/http";
import React from "react";
import { SWRConfig } from "swr";


export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: (url: string) => http(url),
        revalidateOnFocus: false,
        revalidateIfStale: true,
        dedupingInterval: 60000,
        keepPreviousData: true,
        errorRetryCount: 2,
      }}
    >
      {children}
    </SWRConfig>
  );
}
