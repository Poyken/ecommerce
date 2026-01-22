

import { headers } from "next/headers";

type TenantConfig = {
  id: string;
  name: string;
  themeConfig?: {
    primaryColor?: string;
    borderRadius?: string;
  };
};

async function getTenantConfig(): Promise<TenantConfig | null> {
  let host = "localhost";
  try {
    const headersList = await headers();
    host = headersList.get("host") || "localhost";

    // In server environment (Docker/Local), 127.0.0.1 is more reliable than localhost
    // We prioritize process.env.API_URL for server-side fetches if available
    const apiUrl =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:8080/api/v1";

    // We MUST pass the host header to the API so it can identify the tenant
    const res = await fetch(`${apiUrl}/tenants/current/config`, {
      headers: {
        "x-tenant-domain": host,
      },
      next: { revalidate: 60 }, // Cache config for 60s
    });

    if (!res.ok) {
      if (res.status !== 404 && res.status !== 401) {
        console.warn(`[TenantProvider] API returned ${res.status} for ${host}`);
      }
      return null;
    }

    return res.json();
  } catch (error) {
    // If fetch itself fails (network error), log it and return null to avoid crashing the app
    console.error(
      `[TenantProvider] Fetch failed for tenant config (${host}):`,
      (error as Error).message
    );
    return null;
  }
}

export async function TenantProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await getTenantConfig();

  if (!config?.themeConfig) {
    return <>{children}</>;
  }

  const { primaryColor, borderRadius } = config.themeConfig;

  // Validate inputs to prevent CSS injection
  // Only allow valid hex, rgb, rgba, oklch colors and standard radius values
  const isValidColor = (c: string) => /^(#|rgb|rgba|oklch)/.test(c) || /^[a-z]+$/.test(c);
  const isValidRadius = (r: string) => /^[0-9]+(px|rem|em|%)?$/.test(r);

  const safePrimary = primaryColor && isValidColor(primaryColor) ? primaryColor : null;
  const safeRadius = borderRadius && isValidRadius(borderRadius) ? borderRadius : null;

  if (!safePrimary && !safeRadius) {
    return <>{children}</>;
  }

  // Inject CSS Variables into :root safely
  const cssVars = `
    :root {
      ${safePrimary ? `--primary: ${safePrimary};` : ""}
      ${safeRadius ? `--radius: ${safeRadius};` : ""}
      ${safePrimary ? `--ring: ${safePrimary};` : ""}
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      {children}
    </>
  );
}
