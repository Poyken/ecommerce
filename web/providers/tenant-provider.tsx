import { headers } from 'next/headers';

type TenantConfig = {
  id: string;
  name: string;
  themeConfig?: {
    primaryColor?: string;
    borderRadius?: string;
  };
};

async function getTenantConfig(): Promise<TenantConfig | null> {
  try {
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost';
    
    // In server environment (Docker/Local), localhost:8080 usually works if on same machine
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

    // We MUST pass the host header to the API so it can identify the tenant
    const res = await fetch(`${apiUrl}/tenants/current/config`, {
      headers: {
        'x-tenant-domain': host,
      },
      next: { revalidate: 60 }, // Link Cache for 60s
    });

    if (!res.ok) {
        return null;
    }

    return res.json();
  } catch (error) {
    console.error('Failed to fetch tenant config:', error);
    return null;
  }
}

export async function TenantProvider({ children }: { children: React.ReactNode }) {
  const config = await getTenantConfig();

  if (!config?.themeConfig) {
    return <>{children}</>;
  }

  const { primaryColor, borderRadius } = config.themeConfig;
  
  // Inject CSS Variables into :root
  // Note: We use dangerouslySetInnerHTML to ensure this injection happens on server render
  const cssVars = `
    :root {
      ${primaryColor ? `--primary: ${primaryColor};` : ''}
      ${borderRadius ? `--radius: ${borderRadius};` : ''}
      ${primaryColor ? `--ring: ${primaryColor};` : ''}
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      {children}
    </>
  );
}
