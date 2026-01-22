# Tài Liệu Kỹ Thuật Web Application - Ecommerce Platform

## Tổng Quan

Frontend được xây dựng trên **Next.js 16** với App Router, theo kiến trúc **Feature-based** và **Server Components**. Ứng dụng hỗ trợ **multi-language** với next-intl và được thiết kế responsive với TailwindCSS.

### Công Nghệ Chính

- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript 5.9.3
- **Styling**: TailwindCSS 4.1.18 + Shadcn/ui
- **State Management**: Zustand 5.0.9
- **Form Handling**: React Hook Form + Zod
- **Data Fetching**: SWR + Server Actions
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Testing**: Vitest + Playwright
- **Internationalization**: next-intl

## Kiến Trúc Thư Mục

### Cấu Trúc Tổng Thể

```
web/
├── app/                     # Next.js App Router
│   ├── [locale]/           # Internationalized routes
│   │   ├── (auth)/         # Authentication routes
│   │   ├── (dashboard)/    # Dashboard routes
│   │   ├── (shop)/         # Shop routes
│   │   ├── admin/          # Admin panel
│   │   └── api/            # API routes
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── providers.tsx       # App providers
├── features/               # Feature-based modules
│   ├── auth/               # Authentication logic
│   ├── products/           # Product management
│   ├── cart/               # Shopping cart
│   ├── checkout/           # Checkout process
│   ├── orders/             # Order management
│   ├── admin/              # Admin features
│   ├── profile/            # User profile
│   └── ...                 # Other features
├── components/             # Shared UI components
│   ├── ui/                 # Shadcn/ui components
│   ├── forms/              # Form components
│   ├── layout/             # Layout components
│   └── common/             # Common utilities
├── lib/                    # Shared utilities
│   ├── env.ts              # Environment variables
│   ├── utils.ts            # Utility functions
│   ├── validations.ts      # Zod schemas
│   └── api.ts              # API client
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript type definitions
├── i18n/                   # Internationalization config
├── public/                 # Static assets
└── docs/                   # Documentation
```

### Feature Module Structure

Mỗi feature module có cấu trúc chuẩn:

```
features/[feature]/
├── components/             # Feature-specific components
│   ├── [Component].tsx
│   └── index.ts
├── services/               # API services
│   ├── [service].ts
│   └── index.ts
├── store/                  # Zustand store
│   ├── [store].ts
│   └── index.ts
├── hooks/                  # Feature-specific hooks
│   ├── [hook].ts
│   └── index.ts
├── types/                  # Feature-specific types
│   ├── [types].ts
│   └── index.ts
├── actions/                # Server Actions
│   ├── [action].ts
│   └── index.ts
└── index.ts               # Feature exports
```

## App Router Implementation

### Route Structure

```typescript
// app/[locale]/layout.tsx
export default function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

### Route Groups

- **(auth)**: Authentication routes (login, register, forgot-password)
- **(dashboard)**: User dashboard routes
- **(shop)**: Public shop routes
- **admin**: Admin panel routes

### Server Components vs Client Components

```typescript
// Server Component - Default
export default async function ProductPage({
  params
}: {
  params: { id: string }
}) {
  const product = await getProduct(params.id)
  return <ProductView product={product} />
}

// Client Component - With "use client"
'use client'
export default function ProductView({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1)
  // Interactive logic
}
```

## State Management

### Zustand Store Pattern

```typescript
// features/cart/store/cart-store.ts
interface CartStore {
  items: CartItem[]
  total: number
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  clearCart: () => void
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  total: 0,
  addItem: (item) => set((state) => ({
    items: [...state.items, item],
    total: calculateTotal([...state.items, item])
  })),
  removeItem: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id),
    total: calculateTotal(state.items.filter(item => item.id !== id))
  })),
  clearCart: () => set({ items: [], total: 0 })
}))
```

### Global State Providers

```typescript
// app/providers.tsx
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      <QueryProvider>
        <CartProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </CartProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}
```

## Data Fetching Strategy

### SWR for Client-side Data

```typescript
// hooks/use-products.ts
export function useProducts(params: ProductParams) {
  const { data, error, isLoading, mutate } = useSWR(
    ['/api/products', params],
    ([url, params]) => fetcher(url, params),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  return { products: data, error, isLoading, mutate }
}
```

### Server Actions for Mutations

```typescript
// features/products/actions/create-product.ts
'use server'
import { z } from 'zod'
import { createProductSchema } from '../validations'
import { productService } from '../services'

export async function createProduct(
  data: z.infer<typeof createProductSchema>
) {
  try {
    const validatedData = createProductSchema.parse(data)
    const product = await productService.create(validatedData)
    revalidatePath('/admin/products')
    return { success: true, product }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
```

### API Routes

```typescript
// app/api/products/route.ts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const products = await getProducts(searchParams)
    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

## Component Architecture

### Shadcn/ui Integration

```typescript
// components/ui/button.tsx
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)
```

### Smart/Dumb Component Pattern

```typescript
// Smart Component - Container
export default function ProductContainer({ id }: { id: string }) {
  const { product, isLoading, error } = useProduct(id)
  const { addItem } = useCartStore()

  if (isLoading) return <ProductSkeleton />
  if (error) return <ErrorMessage error={error} />

  return (
    <ProductView
      product={product}
      onAddToCart={(quantity) => addItem({ ...product, quantity })}
    />
  )
}

// Dumb Component - Presentational
export function ProductView({
  product,
  onAddToCart
}: {
  product: Product
  onAddToCart: (quantity: number) => void
}) {
  return (
    <div className="product-card">
      {/* Product UI */}
    </div>
  )
}
```

## Form Handling

### React Hook Form + Zod

```typescript
// features/auth/components/login-form.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from '../validations'

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginForm() {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    // Handle login
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  )
}
```

### Server Actions with Forms

```typescript
// features/auth/actions/login.ts
'use server'
import { signIn } from '@/auth'

export async function login(formData: FormData) {
  try {
    await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      redirect: false,
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Invalid credentials' }
  }
}
```

## Authentication & Authorization

### NextAuth.js Configuration

```typescript
// auth.ts
import { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'

export default {
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Validate credentials
      }
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // JWT callback
    },
    async session({ session, token }) {
      // Session callback
    }
  }
} satisfies NextAuthConfig
```

### Route Protection

```typescript
// components/auth-protected.tsx
export default function AuthProtected({
  children,
  roles = []
}: {
  children: React.ReactNode
  roles?: string[]
}) {
  const { data: session } = useSession()
  
  if (!session) {
    return <LoginRequired />
  }
  
  if (roles.length > 0 && !roles.includes(session.user.role)) {
    return <AccessDenied />
  }
  
  return <>{children}</>
}
```

## Performance Optimizations

### Image Optimization

```typescript
// components/optimized-image.tsx
import Image from 'next/image'

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false
}: ImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  )
}
```

### Code Splitting

```typescript
// Dynamic imports for large components
const AdminDashboard = dynamic(
  () => import('@/features/admin/components/dashboard'),
  { 
    loading: () => <DashboardSkeleton />,
    ssr: false 
  }
)
```

### Caching Strategy

```typescript
// Next.js caching
export async function getProducts() {
  const products = await fetch('https://api.example.com/products', {
    next: { 
      revalidate: 3600, // 1 hour
      tags: ['products']
    }
  })
  return products.json()
}
```

## Internationalization

### next-intl Configuration

```typescript
// i18n/request.ts
import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`../messages/${locale}.json`)).default
}))
```

### Language Switching

```typescript
// components/language-switcher.tsx
'use client'
import { useRouter, usePathname } from 'next/navigation'

export default function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()

  const switchLanguage = (locale: string) => {
    router.push(pathname.replace(/^\/[^\/]+/, `/${locale}`))
  }

  return (
    <div>
      <button onClick={() => switchLanguage('en')}>English</button>
      <button onClick={() => switchLanguage('vi')}>Tiếng Việt</button>
    </div>
  )
}
```

## Testing Strategy

### Unit Tests with Vitest

```typescript
// __tests__/components/button.test.tsx
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    screen.getByRole('button').click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### E2E Tests with Playwright

```typescript
// e2e/user-journey.spec.ts
import { test, expect } from '@playwright/test'

test('user can purchase a product', async ({ page }) => {
  await page.goto('/')
  
  // Navigate to product
  await page.click('[data-testid="product-card"]')
  
  // Add to cart
  await page.click('[data-testid="add-to-cart"]')
  
  // Checkout
  await page.click('[data-testid="checkout-button"]')
  
  // Fill form and complete purchase
  await page.fill('[data-testid="email"]', 'test@example.com')
  await page.click('[data-testid="complete-purchase"]')
  
  // Verify success
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
})
```

## Deployment

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM base AS builder
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base AS runner
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:8080

# Feature flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_CHAT=true
```

## Best Practices

### Code Organization
- **Feature-based structure** cho maintainability
- **Barrel exports** cho clean imports
- **Consistent naming conventions**
- **TypeScript strict mode**

### Performance Best Practices
- **Image optimization** với Next.js Image
- **Code splitting** cho large components
- **Lazy loading** cho non-critical resources
- **Proper caching strategies**

### Security Best Practices
- **CSRF protection** với Next.js
- **Content Security Policy** headers
- **Input validation** với Zod
- **Secure cookie handling**

### Accessibility
- **Semantic HTML** elements
- **ARIA labels** cho screen readers
- **Keyboard navigation** support
- **Color contrast** compliance

## Monitoring & Analytics

### Error Tracking
```typescript
// Error boundaries
'use client'
export default function ErrorBoundary({
  error,
  reset
}: {
  error: Error
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error(error)
  }, [error])

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

### Performance Monitoring
- **Web Vitals** tracking
- **Custom metrics** cho business KPIs
- **User behavior analytics**
- **Error rate monitoring**

## Hướng Dẫn Vận Hành Chi Tiết

### 1. Cài Đặt Môi Trường

#### Yêu Cầu Hệ Thống
- **Node.js**: 18.x hoặc cao hơn (khuyến nghị 20.x)
- **npm**: 9.x hoặc cao hơn
- **RAM**: Tối thiểu 4GB, khuyến nghị 8GB
- **Disk**: Tối thiểu 10GB available space
- **Browser**: Chrome/Firefox/Safari latest versions

#### Cài Đặt Step-by-Step

```bash
# 1. Clone repository
git clone <repository-url>
cd ecommerce-main/web

# 2. Cài đặt dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Cấu hình environment variables
nano .env
```

#### Cấu Trúc .env Chi Tiết

```bash
# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:8080

# Development Configuration
NODE_ENV=development
PORT=3000

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_CHAT=true
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_ENABLE_DARK_MODE=true

# Third-party Services
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_CLARITY_ID=your-clarity-id

# Payment Gateway (Stripe)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Social Login
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_FACEBOOK_APP_ID=your-facebook-app-id

# Map Services
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your-mapbox-token

# CDN Configuration
NEXT_PUBLIC_CDN_URL=https://cdn.example.com
NEXT_PUBLIC_MEDIA_URL=https://media.example.com

# Performance Monitoring
NEXT_PUBLIC_PERFORMANCE_MONITORING=true
NEXT_PUBLIC_ERROR_REPORTING=true

# Development Tools
NEXT_PUBLIC_DEV_TOOLS=true
NEXT_PUBLIC_DEBUG_MODE=false
```

### 2. Development Workflow

#### Start Development Server

```bash
# Start development server
npm run dev

# Start with specific host
npm run dev -- -H 0.0.0.0

# Start with specific port
npm run dev -- -p 3001
```

#### Common Development Commands

```bash
# Build application
npm run build

# Start production server
npm run start

# Linting
npm run lint
npm run lint:fix

# Testing
npm run test              # Run tests
npm run test:run          # Run tests once
npm run test:e2e          # Run E2E tests
npm run test:ui           # Open Vitest UI

# Type checking
npm run type-check

# Clean build artifacts
npm run clean

# Generate icons (PWA)
npm run generate-icons
```

#### Development Tools Configuration

```typescript
// next.config.ts development settings
const nextConfig: NextConfig = {
  // Development optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Source maps for debugging
  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = 'eval-source-map'
    }
    return config
  },
  
  // Development rewrites
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:8080/api/v1/:path*',
      },
    ]
  },
}
```

### 3. Component Development Guide

#### Creating New Components

```typescript
// components/ui/button.tsx
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

#### Feature Component Structure

```typescript
// features/products/components/product-card.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/features/cart/store'
import { Product } from '@/types'

interface ProductCardProps {
  product: Product
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const addItem = useCartStore((state) => state.addItem)

  const handleAddToCart = async () => {
    setIsLoading(true)
    try {
      await addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        quantity: 1,
      })
    } catch (error) {
      console.error('Failed to add to cart:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('product-card', className)}>
      <div className="relative aspect-square">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className="object-cover rounded-md"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="mt-4">
        <h3 className="font-semibold">{product.name}</h3>
        <p className="text-sm text-muted-foreground">{product.category}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-lg font-bold">${product.price}</span>
          <Button
            onClick={handleAddToCart}
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? 'Adding...' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

### 4. State Management Implementation

#### Zustand Store Setup

```typescript
// features/cart/store/cart-store.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { CartItem, Product } from '@/types'

interface CartStore {
  items: CartItem[]
  total: number
  itemCount: number
  isOpen: boolean
  
  // Actions
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  
  // Computed
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      itemCount: 0,
      isOpen: false,

      addItem: (item) => {
        const existingItem = get().items.find(
          (i) => i.productId === item.productId
        )

        if (existingItem) {
          set((state) => ({
            items: state.items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          }))
        } else {
          const newItem: CartItem = {
            ...item,
            id: crypto.randomUUID(),
          }
          set((state) => ({
            items: [...state.items, newItem],
          }))
        }

        // Update computed values
        set({
          total: get().getTotal(),
          itemCount: get().getItemCount(),
        })
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
          total: get().getTotal(),
          itemCount: get().getItemCount(),
        }))
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
          total: get().getTotal(),
          itemCount: get().getItemCount(),
        }))
      },

      clearCart: () => {
        set({
          items: [],
          total: 0,
          itemCount: 0,
        })
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }))
      },

      getTotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
```

### 5. Data Fetching Patterns

#### SWR Configuration

```typescript
// lib/swr-config.ts
import { SWRConfig } from 'swr'
import { fetcher } from './api'

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 60000,
        errorRetryCount: 3,
        errorRetryInterval: 5000,
        onError: (error, key) => {
          console.error('SWR Error:', error, 'Key:', key)
        },
      }}
    >
      {children}
    </SWRConfig>
  )
}
```

#### Custom Hooks

```typescript
// hooks/use-products.ts
import useSWR from 'swr'
import { Product, ProductFilters } from '@/types'
import { fetcher } from '@/lib/api'

interface UseProductsOptions {
  filters?: ProductFilters
  enabled?: boolean
}

export function useProducts({ filters, enabled = true }: UseProductsOptions = {}) {
  const queryString = new URLSearchParams(filters as any).toString()
  const key = enabled ? ['/api/products', queryString] : null

  const { data, error, isLoading, mutate } = useSWR(
    key,
    ([url, query]) => fetcher(`${url}?${query}`),
    {
      revalidateOnMount: true,
      refreshInterval: 0,
    }
  )

  return {
    products: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
  }
}

export function useProduct(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/products/${id}` : null,
    fetcher
  )

  return {
    product: data,
    isLoading,
    error,
    mutate,
  }
}
```

### 6. Form Handling Implementation

#### Form Validation with Zod

```typescript
// features/auth/validations/auth-validation.ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
})

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'First name is required')
      .min(2, 'First name must be at least 2 characters'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .min(2, 'Last name must be at least 2 characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
```

#### Form Component Implementation

```typescript
// features/auth/components/login-form.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { loginSchema, type LoginFormData } from '../validations/auth-validation'
import { useAuthStore } from '../store/auth-store'

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const login = useAuthStore((state) => state.login)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      await login(data)
      // Redirect or show success message
    } catch (error) {
      console.error('Login failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </Form>
  )
}
```

### 7. Internationalization Setup

#### i18n Configuration

```typescript
// i18n/request.ts
import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`../messages/${locale}.json`)).default,
  timeZone: 'Asia/Ho_Chi_Minh',
}))

// i18n/config.ts
import { defineRouting } from 'next-intl/routing'
import { createSharedPathnamesNavigation } from 'next-intl/navigation'

export const routing = defineRouting({
  locales: ['en', 'vi'],
  defaultLocale: 'en',
  pathnames: {
    '/': '/',
    '/products': {
      en: '/products',
      vi: '/san-pham'
    },
    '/cart': {
      en: '/cart',
      vi: '/gio-hang'
    }
  }
})

export const { Link, redirect, usePathname, useRouter } = createSharedPathnamesNavigation(routing)
```

#### Translation Files

```json
// messages/en.json
{
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "success": "Success",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit"
  },
  "auth": {
    "login": "Login",
    "register": "Register",
    "logout": "Logout",
    "email": "Email",
    "password": "Password",
    "firstName": "First Name",
    "lastName": "Last Name"
  },
  "products": {
    "title": "Products",
    "addToCart": "Add to Cart",
    "outOfStock": "Out of Stock",
    "price": "Price",
    "category": "Category"
  }
}

// messages/vi.json
{
  "common": {
    "loading": "Đang tải...",
    "error": "Lỗi",
    "success": "Thành công",
    "cancel": "Hủy",
    "save": "Lưu",
    "delete": "Xóa",
    "edit": "Chỉnh sửa"
  },
  "auth": {
    "login": "Đăng nhập",
    "register": "Đăng ký",
    "logout": "Đăng xuất",
    "email": "Email",
    "password": "Mật khẩu",
    "firstName": "Tên",
    "lastName": "Họ"
  },
  "products": {
    "title": "Sản phẩm",
    "addToCart": "Thêm vào giỏ hàng",
    "outOfStock": "Hết hàng",
    "price": "Giá",
    "category": "Danh mục"
  }
}
```

### 8. Performance Optimization

#### Image Optimization

```typescript
// components/optimized-image.tsx
import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  fill?: boolean
  sizes?: string
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  if (error) {
    return (
      <div className={cn('flex items-center justify-center bg-muted', className)}>
        <span className="text-muted-foreground">Image not available</span>
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        priority={priority}
        sizes={sizes}
        quality={85}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        className={cn(
          'duration-700 ease-in-out',
          isLoading ? 'scale-110 blur-2xl grayscale' : 'scale-100 blur-0 grayscale-0'
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => setError(true)}
      />
    </div>
  )
}
```

#### Code Splitting

```typescript
// Dynamic imports for large components
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { ComponentSkeleton } from '@/components/skeletons'

// Admin dashboard - heavy component
const AdminDashboard = dynamic(
  () => import('@/features/admin/components/dashboard'),
  {
    loading: () => <ComponentSkeleton />,
    ssr: false, // Client-side only for admin features
  }
)

// Chart components - load on demand
const ProductChart = dynamic(
  () => import('@/components/charts/product-chart'),
  {
    loading: () => <div className="h-64 bg-muted animate-pulse rounded" />,
  }
)

// Usage in component
export function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<ComponentSkeleton />}>
        <AdminDashboard />
      </Suspense>
    </div>
  )
}
```

### 9. Testing Implementation

#### Unit Tests with Vitest

```typescript
// __tests__/components/button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('renders correctly with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies variant styles correctly', () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-destructive')
  })

  it('is disabled when loading', () => {
    render(<Button disabled>Loading...</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })
})
```

#### E2E Tests with Playwright

```typescript
// e2e/user-journey.spec.ts
import { test, expect } from '@playwright/test'

test.describe('E-commerce User Journey', () => {
  test('user can browse products and make a purchase', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/')
    
    // Verify page loaded
    await expect(page.locator('h1')).toContainText('Welcome')
    
    // Navigate to products
    await page.click('text=Products')
    await expect(page).toHaveURL(/.*\/products/)
    
    // Filter products
    await page.selectOption('[data-testid="category-filter"]', 'electronics')
    await page.click('text=Apply Filters')
    
    // Select first product
    await page.click('[data-testid="product-card"]:first-child')
    
    // Add to cart
    await page.click('[data-testid="add-to-cart"]')
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1')
    
    // Go to cart
    await page.click('[data-testid="cart-icon"]')
    await expect(page).toHaveURL(/.*\/cart/)
    
    // Proceed to checkout
    await page.click('[data-testid="checkout-button"]')
    
    // Fill shipping information
    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="firstName"]', 'John')
    await page.fill('[data-testid="lastName"]', 'Doe')
    await page.fill('[data-testid="address"]', '123 Main St')
    await page.fill('[data-testid="city"]', 'New York')
    await page.fill('[data-testid="postalCode"]', '10001')
    
    // Complete purchase
    await page.click('[data-testid="complete-purchase"]')
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible()
  })

  test('user authentication flow', async ({ page }) => {
    // Navigate to login
    await page.goto('/auth/login')
    
    // Fill login form
    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    
    // Verify successful login
    await expect(page).toHaveURL(/.*\/dashboard/)
    await expect(page.locator('[data-testid="user-menu"]')).toContainText('John Doe')
  })
})
```

### 10. Troubleshooting Guide

#### Common Issues và Solutions

**Issue 1: Build Failed - TypeScript Errors**
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Fix common issues
npm run lint -- --fix

# Clear Next.js cache
rm -rf .next
npm run build
```

**Issue 2: Styles Not Loading**
```bash
# Check Tailwind configuration
npx tailwindcss --help

# Rebuild styles
npm run build

# Check CSS imports
grep -r "globals.css" app/
```

**Issue 3: API Calls Failing**
```bash
# Check API server status
curl http://localhost:8080/health

# Verify environment variables
cat .env | grep API_URL

# Check network requests in browser dev tools
```

**Issue 4: State Management Issues**
```typescript
// Debug Zustand store
import { useCartStore } from '@/features/cart/store'

// In component
const cartDebug = useCartStore((state) => state)
console.log('Cart state:', cartDebug)

// Reset store if needed
useCartStore.getState().clearCart()
```

**Issue 5: Images Not Loading**
```bash
# Check Next.js image configuration
grep -A 10 "images:" next.config.ts

# Verify image domains
echo $NEXT_PUBLIC_IMAGE_DOMAINS

# Test image URL manually
curl -I https://example.com/image.jpg
```

### 11. Deployment Procedures

#### Production Build

```bash
# 1. Install production dependencies
npm ci --only=production

# 2. Build application
npm run build

# 3. Test production build locally
npm run start

# 4. Verify build output
ls -la .next/
```

#### Docker Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM base AS builder
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base AS runner
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Environment-Specific Builds

```bash
# Development
NODE_ENV=development npm run build

# Staging
NODE_ENV=staging npm run build

# Production
NODE_ENV=production npm run build

# With custom environment file
DOTENV_CONFIG_PATH=.env.staging npm run build
```

### 12. Monitoring & Analytics

#### Performance Monitoring

```typescript
// lib/performance.ts
export function reportWebVitals(metric: any) {
  // Send to analytics service
  if (process.env.NODE_ENV === 'production') {
    gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    })
  }
}

// Custom performance tracking
export function trackPageLoad(page: string) {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
  const loadTime = navigation.loadEventEnd - navigation.loadEventStart
  
  console.log(`Page ${page} loaded in ${loadTime}ms`)
}
```

#### Error Tracking

```typescript
// lib/error-tracking.ts
export function trackError(error: Error, context?: any) {
  console.error('Application Error:', error, context)
  
  // Send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Sentry, LogRocket, etc.
  }
}

// Error boundary component
'use client'
import { Component, ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    trackError(error, { errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 border border-red-200 rounded-md bg-red-50">
          <h2 className="text-red-800">Something went wrong</h2>
          <p className="text-red-600">{this.state.error?.message}</p>
        </div>
      )
    }

    return this.props.children
  }
}
```

## Best Practices

### Development Best Practices

1. **Code Organization**
   - Feature-based structure
   - Consistent naming conventions
   - Proper TypeScript usage
   - Component composition over inheritance

2. **Performance Optimization**
   - Image optimization với Next.js Image
   - Code splitting cho large components
   - Proper caching strategies
   - Bundle size optimization

3. **User Experience**
   - Loading states và skeletons
   - Error boundaries
   - Responsive design
   - Accessibility compliance

### Security Best Practices

1. **Data Protection**
   - Input validation với Zod
   - XSS prevention
   - CSRF protection
   - Secure cookie handling

2. **API Security**
   - Proper error handling
   - Rate limiting
   - Authentication checks
   - HTTPS enforcement

### Testing Best Practices

1. **Test Coverage**
   - Unit tests cho utilities
   - Integration tests cho components
   - E2E tests cho user flows
   - Performance testing

2. **Test Quality**
   - Descriptive test names
   - Proper assertions
   - Mock external dependencies
   - Test edge cases
