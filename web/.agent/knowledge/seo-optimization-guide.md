# SEO Optimization Guide

> **Goal**: Maximize organic search visibility  
> **Target**: Google PageSpeed >90, rich snippets

---

## 1. Auto-Generated Sitemap

### Implementation

```typescript
// app/sitemap.ts
import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Static pages
  const staticPages = ["", "/about", "/contact", "/features", "/pricing"].map(
    (route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1,
    }),
  );

  // Dynamic: Products
  const products = await prisma.product.findMany({
    where: { deletedAt: null, published: true },
    select: { slug: true, updatedAt: true },
  });

  const productPages = products.map((p) => ({
    url: `${baseUrl}/products/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // Dynamic: Categories
  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    select: { slug: true, updatedAt: true },
  });

  const categoryPages = categories.map((c) => ({
    url: `${baseUrl}/categories/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...productPages, ...categoryPages];
}
```

**Access**: `https://your-app.vercel.app/sitemap.xml`

### Submit to Google

1. Google Search Console: https://search.google.com/search-console
2. Add property: `https://your-app.vercel.app`
3. **Sitemaps** → Add sitemap URL

---

## 2. Robots.txt

```typescript
// app/robots.ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/_next/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

---

## 3. Structured Data (Schema.org)

### Product Schema

```typescript
// app/products/[slug]/page.tsx
import { Product, WithContext } from 'schema-dts';

export default async function ProductPage({ params }) {
  const product = await getProduct(params.slug);

  const jsonLd: WithContext<Product> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images.map((img) => img.url),
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'VND',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Your Store',
      },
    },
    aggregateRating: product.reviewCount > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: product.avgRating,
      reviewCount: product.reviewCount,
    } : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetails product={product} />
    </>
  );
}
```

### Organization Schema

```typescript
// app/layout.tsx
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Your E-commerce',
  url: 'https://your-app.vercel.app',
  logo: 'https://your-app.vercel.app/logo.png',
  sameAs: [
    'https://facebook.com/yourpage',
    'https://twitter.com/yourhandle',
  ],
};

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
/>
```

### Breadcrumbs Schema

```typescript
const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://your-app.vercel.app",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Products",
      item: "https://your-app.vercel.app/products",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: product.name,
    },
  ],
};
```

---

## 4. Meta Tags

### Dynamic Meta Tags

```typescript
// app/products/[slug]/page.tsx
import { Metadata } from "next";

export async function generateMetadata({ params }): Promise<Metadata> {
  const product = await getProduct(params.slug);

  return {
    title: `${product.name} - Your Store`,
    description: product.description.slice(0, 160),
    keywords: product.tags.join(", "),
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.images[0]?.url],
      type: "website",
      siteName: "Your Store",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description,
      images: [product.images[0]?.url],
    },
    alternates: {
      canonical: `https://your-app.vercel.app/products/${product.slug}`,
    },
  };
}
```

### Root Layout Meta

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: {
    template: "%s | Your Store",
    default: "Your Store - Best Products Online",
  },
  description: "Shop high-quality products at great prices",
  keywords: ["ecommerce", "online shopping", "products"],
  authors: [{ name: "Your Company" }],
  creator: "Your Company",
  metadataBase: new URL("https://your-app.vercel.app"),
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "Your Store",
  },
};
```

---

## 5. Performance Optimization

### Image Optimization

```tsx
import Image from 'next/image';

// ✅ Optimized
<Image
  src={product.image}
  alt={product.name}
  width={500}
  height={500}
  priority={isAboveFold}
  sizes="(max-width: 768px) 100vw, 50vw"
/>

// ❌ Not optimized
<img src={product.image} alt={product.name} />
```

### Font Optimization

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap', // Avoid FOIT
});

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={inter.className}>
      {children}
    </html>
  );
}
```

### Code Splitting

```typescript
// app/admin/page.tsx
import dynamic from 'next/dynamic';

// Heavy charts only load on admin pages
const AdminChart = dynamic(() => import('@/components/admin-chart'), {
  loading: () => <Skeleton />,
  ssr: false, // Client-side only
});
```

---

## 6. Core Web Vitals

### Largest Contentful Paint (LCP)

Target: <2.5s

```tsx
// Priority load hero image
<Image src="/hero.jpg" alt="Hero" priority />

// Preload critical resources
<link rel="preload" as="image" href="/hero.jpg" />
```

### First Input Delay (FID)

Target: <100ms

```typescript
// Defer non-critical JavaScript
const Analytics = dynamic(() => import("@/components/analytics"), {
  ssr: false,
});
```

### Cumulative Layout Shift (CLS)

Target: <0.1

```tsx
// Always specify dimensions
<Image src="/logo.png" width={150} height={50} alt="Logo" />

// Reserve space for dynamic content
<div className="min-h-[200px]">
  {loading ? <Skeleton /> : <Content />}
</div>
```

---

## 7. Accessibility (A11y)

```tsx
// Semantic HTML
<header>
  <nav aria-label="Main navigation">
    <Link href="/">Home</Link>
  </nav>
</header>

<main>
  <h1>Product List</h1>
  <section aria-labelledby="featured-products">
    <h2 id="featured-products">Featured Products</h2>
  </section>
</main>

// Alt text for images
<Image src={product.image} alt={`${product.name} - ${product.category}`} />

// ARIA labels
<button aria-label="Add to cart">
  <ShoppingCart />
</button>
```

---

## 8. Internationalization (i18n) for SEO

```typescript
// app/layout.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const locale = params.locale || "vi";

  return {
    alternates: {
      canonical: `https://your-app.vercel.app/${locale}`,
      languages: {
        "vi-VN": `https://your-app.vercel.app/vi`,
        "en-US": `https://your-app.vercel.app/en`,
      },
    },
  };
}
```

---

## 9. Testing & Validation

### Lighthouse

```bash
# Install
npm install -g lighthouse

# Run audit
lighthouse https://your-app.vercel.app --view

# Target scores
Performance: >90
Accessibility: >95
Best Practices: >95
SEO: >95
```

### Rich Results Test

1. Visit: https://search.google.com/test/rich-results
2. Enter product URL
3. Verify structured data appears

### PageSpeed Insights

1. Visit: https://pagespeed.web.dev/
2. Enter URL
3. Check Core Web Vitals

---

## 10. Monitoring

### Google Search Console

Track:

- Impressions
- Clicks
- CTR
- Average position

### Vercel Analytics

Monitor:

- Real User Metrics
- Core Web Vitals
- Page load times

---

## Best Practices

### DO

- ✅ Use semantic HTML
- ✅ Optimize images (WebP, sizes)
- ✅ Generate dynamic sitemaps
- ✅ Add structured data
- ✅ Monitor Core Web Vitals

### DON'T

- ❌ Use client-side rendering for content
- ❌ Block rendering with large JS bundles
- ❌ Forget alt text
- ❌ Ignore mobile performance
- ❌ Duplicate meta descriptions

---

**Target**: Google Page 1 for "{product category} Vietnam" within 3-6 months
