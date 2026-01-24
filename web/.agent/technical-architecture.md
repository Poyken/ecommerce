# Tài Liệu Kiến Trúc Kỹ Thuật Web - Ecommerce Platform

## Tổng Quan Kiến Trúc

### Architecture Pattern: Feature-Based với Server Components
- **Framework**: Next.js 16 với App Router
- **Rendering**: Hybrid (Server Components + Client Components)
- **State Management**: Zustand với persistence
- **Styling**: TailwindCSS với Shadcn/ui components
- **Data Fetching**: SWR + Server Actions

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CDN (CloudFront)                       │
├─────────────────────────────────────────────────────────────┤
│                   Next.js Application                       │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐ │
│  │   App Router│   Features  │ Components  │    Lib      │ │
│  │   (SSR/CSR) │   Modules   │   (UI)      │  (Utils)    │ │
│  └─────────────┴─────────────┴─────────────┴─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                               │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐ │
│  │     SWR     │   Zustand   │   Local     │   Session   │ │
│  │  (Client)   │  (State)    │  Storage    │  (Auth)     │ │
│  └─────────────┴─────────────┴─────────────┴─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                   External APIs                             │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐ │
│  │   Backend   │   Payment   │   Analytics │    CDN      │ │
│  │     API     │   Gateway   │   (GA4)     │ (Images)    │ │
│  └─────────────┴─────────────┴─────────────┴─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. App Router Structure

#### Route Organization
```typescript
// app/[locale]/layout.tsx - Root Layout
export default async function LocaleLayout({
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
          <SWRProvider>
            <CartProvider>
              <ThemeProvider>
                {children}
              </ThemeProvider>
            </CartProvider>
          </SWRProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

// Route Groups cho logical separation
app/[locale]/
├── (auth)/              # Authentication routes
│   ├── login/
│   ├── register/
│   └── forgot-password/
├── (dashboard)/         # User dashboard
│   ├── profile/
│   ├── orders/
│   └── settings/
├── (shop)/              # Public shop
│   ├── products/
│   ├── categories/
│   └── cart/
├── admin/               # Admin panel
│   ├── products/
│   ├── orders/
│   └── analytics/
└── api/                 # API routes
    ├── auth/
    ├── products/
    └── webhook/
```

#### Server vs Client Components
```typescript
// Server Component - Default
export default async function ProductPage({
  params
}: {
  params: { id: string }
}) {
  const product = await getProduct(params.id)
  const relatedProducts = await getRelatedProducts(params.id)
  
  return (
    <div>
      <ProductView product={product} />
      <ProductCarousel products={relatedProducts} />
    </div>
  )
}

// Client Component - Interactive
'use client'
export function ProductView({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCartStore()
  
  return (
    <div>
      <ProductImage src={product.image} />
      <ProductInfo product={product} />
      <AddToCart 
        onAdd={() => addItem({ ...product, quantity })}
        quantity={quantity}
        onQuantityChange={setQuantity}
      />
    </div>
  )
}
```

### 2. Feature-Based Architecture

#### Module Structure
```typescript
// features/products/
├── components/
│   ├── product-card.tsx
│   ├── product-list.tsx
│   ├── product-detail.tsx
│   └── product-filters.tsx
├── services/
│   ├── product-service.ts
│   └── product-api.ts
├── store/
│   └── product-store.ts
├── hooks/
│   ├── use-products.ts
│   └── use-product.ts
├── types/
│   └── product-types.ts
├── actions/
│   └── product-actions.ts
└── index.ts
```

#### Feature Module Implementation
```typescript
// features/products/services/product-service.ts
export class ProductService {
  async getProducts(filters: ProductFilters): Promise<ProductResponse> {
    const params = new URLSearchParams(filters as any).toString()
    return fetcher(`/api/products?${params}`)
  }
  
  async getProduct(id: string): Promise<Product> {
    return fetcher(`/api/products/${id}`)
  }
  
  async createProduct(data: CreateProductDto): Promise<Product> {
    return fetcher('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

// features/products/hooks/use-products.ts
export function useProducts(filters: ProductFilters = {}) {
  const { data, error, isLoading, mutate } = useSWR(
    ['/api/products', filters],
    ([url, filters]) => productService.getProducts(filters),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
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
```

## State Management Architecture

### 1. Zustand Store Pattern

#### Global State Management
```typescript
// features/cart/store/cart-store.ts
interface CartStore {
  // State
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
        
        set({
          total: get().getTotal(),
          itemCount: get().getItemCount(),
        })
      },
      
      getTotal: () => {
        return get().items.reduce((sum, item) => 
          sum + item.price * item.quantity, 0
        )
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

#### State Synchronization
```typescript
// lib/sync-service.ts
export class SyncService {
  static async syncWithServer(store: any) {
    // Sync cart state with server
    const cartState = store.getState()
    
    try {
      await fetcher('/api/cart/sync', {
        method: 'POST',
        body: JSON.stringify(cartState),
      })
    } catch (error) {
      console.error('Sync failed:', error)
    }
  }
  
  static setupSync(store: any) {
    // Sync on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.syncWithServer(store)
      }
    })
    
    // Sync on interval
    setInterval(() => {
      this.syncWithServer(store)
    }, 30000) // 30 seconds
  }
}
```

### 2. Data Fetching Architecture

#### SWR Configuration
```typescript
// lib/swr-config.ts
export const swrConfig = {
  fetcher: async (url: string, options?: RequestInit) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  },
  
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 60000,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
}

// lib/swr-provider.tsx
export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={swrConfig}>
      {children}
    </SWRConfig>
  )
}
```

#### Server Actions Integration
```typescript
// features/products/actions/product-actions.ts
'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createProduct(formData: FormData) {
  const data = {
    name: formData.get('name') as string,
    price: parseFloat(formData.get('price') as string),
    description: formData.get('description') as string,
  }
  
  try {
    const product = await productService.create(data)
    revalidatePath('/admin/products')
    redirect(`/admin/products/${product.id}`)
  } catch (error) {
    return { error: error.message }
  }
}

// Usage in component
export default function CreateProductForm() {
  return (
    <form action={createProduct}>
      <input name="name" required />
      <input name="price" type="number" required />
      <textarea name="description" />
      <button type="submit">Create Product</button>
    </form>
  )
}
```

## Component Architecture

### 1. Component Hierarchy

#### Atomic Design Pattern
```typescript
// atoms/
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, className, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)

// molecules/
export const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <Card>
      <ProductImage src={product.image} alt={product.name} />
      <CardContent>
        <ProductTitle title={product.name} />
        <ProductPrice price={product.price} />
        <AddToCartButton productId={product.id} />
      </CardContent>
    </Card>
  )
}

// organisms/
export const ProductGrid = ({ products }: ProductGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

### 2. Component Patterns

#### Compound Components
```typescript
// components/ui/tabs.tsx
const TabsContext = createContext<TabsContextValue>({
  value: '',
  onValueChange: () => {},
})

export const Tabs = ({ children, defaultValue, onValueChange }: TabsProps) => {
  const [value, setValue] = useState(defaultValue)
  
  return (
    <TabsContext.Provider value={{ value, onValueChange: setValue }}>
      {children}
    </TabsContext.Provider>
  )
}

export const TabsList = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex space-x-2 border-b">
      {children}
    </div>
  )
}

export const TabsTrigger = ({ value, children }: TabsTriggerProps) => {
  const { value: currentValue, onValueChange } = useContext(TabsContext)
  
  return (
    <button
      className={cn(
        'px-4 py-2 border-b-2 transition-colors',
        currentValue === value
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground'
      )}
      onClick={() => onValueChange(value)}
    >
      {children}
    </button>
  )
}
```

#### Render Props Pattern
```typescript
// components/data-provider.tsx
export function DataProvider<T>({
  url,
  children,
  loading: LoadingComponent,
  error: ErrorComponent,
}: DataProviderProps<T>) {
  const { data, error, isLoading } = useSWR<T>(url, fetcher)
  
  if (isLoading) return <LoadingComponent />
  if (error) return <ErrorComponent error={error} />
  
  return children(data)
}

// Usage
<DataProvider
  url="/api/products"
  loading={<ProductSkeleton />}
  error={<ErrorMessage />}
>
  {(products) => <ProductGrid products={products} />}
</DataProvider>
```

## Performance Architecture

### 1. Rendering Optimization

#### Code Splitting Strategy
```typescript
// Dynamic imports for route-based splitting
const AdminDashboard = dynamic(
  () => import('@/features/admin/components/dashboard'),
  {
    loading: () => <DashboardSkeleton />,
    ssr: false, // Client-side only for admin features
  }
)

// Component-level splitting
const ChartComponent = dynamic(
  () => import('@/components/charts/sales-chart'),
  {
    loading: () => <ChartSkeleton />,
  }
)

// Usage in route
export default function AdminPage() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <Suspense fallback={<DashboardSkeleton />}>
        <AdminDashboard />
      </Suspense>
    </div>
  )
}
```

#### Image Optimization
```typescript
// components/optimized-image.tsx
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  fill = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  
  if (error) {
    return <ImageFallback />
  }
  
  return (
    <div className="relative overflow-hidden">
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
        blurDataURL="data:image/jpeg;base64,..."
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

### 2. Bundle Optimization

#### Tree Shaking Configuration
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      'recharts',
      'date-fns',
      'lodash',
    ],
  },
  
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      }
    }
    
    return config
  },
}
```

## Security Architecture

### 1. Client-Side Security

#### Input Validation
```typescript
// lib/validation.ts
import { z } from 'zod'

export const contactFormSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(1000),
})

// Component usage
export function ContactForm() {
  const form = useForm({
    resolver: zodResolver(contactFormSchema),
  })
  
  const onSubmit = async (data: ContactFormData) => {
    // Client-side validation passed
    // Server-side validation will also occur
    await submitContactForm(data)
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

#### XSS Prevention
```typescript
// lib/sanitize.ts
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a'],
    ALLOWED_ATTR: ['href', 'target'],
  })
}

// Usage in component
export function RichTextContent({ content }: { content: string }) {
  const sanitizedContent = useMemo(() => sanitizeHtml(content), [content])
  
  return (
    <div 
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  )
}
```

### 2. Authentication Architecture

#### Session Management
```typescript
// lib/auth.ts
export function useAuth() {
  const { data: session, status } = useSession()
  
  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  }
}

// Protected route component
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) {
    return <AuthSkeleton />
  }
  
  if (!isAuthenticated) {
    return <LoginRequired />
  }
  
  return <>{children}</>
}
```

## Internationalization Architecture

### 1. Multi-Language Support

#### i18n Configuration
```typescript
// i18n/config.ts
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

// messages/en.json
{
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "success": "Success"
  },
  "products": {
    "title": "Products",
    "addToCart": "Add to Cart",
    "outOfStock": "Out of Stock"
  }
}

// messages/vi.json
{
  "common": {
    "loading": "Đang tải...",
    "error": "Lỗi",
    "success": "Thành công"
  },
  "products": {
    "title": "Sản phẩm",
    "addToCart": "Thêm vào giỏ hàng",
    "outOfStock": "Hết hàng"
  }
}
```

#### Dynamic Translation
```typescript
// components/translated-text.tsx
import { useTranslations } from 'next-intl'

export function TranslatedText({ 
  namespace, 
  key, 
  values 
}: TranslatedTextProps) {
  const t = useTranslations(namespace)
  
  return <>{t(key, values)}</>
}

// Usage
<TranslatedText 
  namespace="products" 
  key="addToCart" 
  values={{ count: 2 }} 
/>
```

## Testing Architecture

### 1. Unit Testing Strategy

#### Component Testing
```typescript
// __tests__/components/product-card.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { ProductCard } from '@/features/products/components/product-card'

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    price: 99.99,
    image: '/test-image.jpg',
  }
  
  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />)
    
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('$99.99')).toBeInTheDocument()
  })
  
  it('calls onAddToCart when button is clicked', () => {
    const mockOnAddToCart = vi.fn()
    render(<ProductCard product={mockProduct} onAddToCart={mockOnAddToCart} />)
    
    fireEvent.click(screen.getByText('Add to Cart'))
    expect(mockOnAddToCart).toHaveBeenCalledWith(mockProduct)
  })
})
```

### 2. E2E Testing Architecture

#### Playwright Configuration
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
})
```

## Design Decisions & Trade-offs

### Architecture Decisions

1. **Next.js App Router vs Pages Router**
   - **Decision**: App Router with Server Components
   - **Rationale**: Better performance, improved DX, automatic code splitting
   - **Trade-off**: Newer technology, learning curve, migration complexity

2. **Feature-Based vs Layer-Based Architecture**
   - **Decision**: Feature-based organization
   - **Rationale**: Better scalability, easier maintenance, clear boundaries
   - **Trade-off**: Initial complexity, potential code duplication

3. **Zustand vs Redux**
   - **Decision**: Zustand for state management
   - **Rationale**: Simpler API, TypeScript support, smaller bundle size
   - **Trade-off**: Less ecosystem, fewer dev tools

4. **SWR vs React Query**
   - **Decision**: SWR for data fetching
   - **Rationale**: Simpler API, Next.js integration, good performance
   - **Trade-off**: Fewer features, less active development

5. **TailwindCSS vs CSS-in-JS**
   - **Decision**: TailwindCSS with Shadcn/ui
   - **Rationale**: Consistent design, smaller bundle size, better performance
   - **Trade-off**: Learning curve, utility-first approach

### Performance Considerations

1. **Rendering Strategy**
   - Server Components for static content
   - Client Components for interactive UI
   - Dynamic imports for code splitting

2. **Bundle Optimization**
   - Tree shaking for unused code
   - Dynamic imports for heavy components
   - Image optimization with Next.js Image

3. **Caching Strategy**
   - SWR for client-side caching
   - Next.js caching for API routes
   - Browser caching for static assets

### Security Considerations

1. **Input Validation**
   - Client-side validation with Zod
   - Server-side validation in API routes
   - XSS prevention with DOMPurify

2. **Authentication**
   - NextAuth.js for session management
   - JWT tokens for API authentication
   - CSRF protection for forms

## Future Scalability Roadmap

### Phase 1: Optimization (Current)
- Bundle size optimization
- Performance monitoring
- Accessibility improvements

### Phase 2: Advanced Features
- PWA implementation
- Advanced caching strategies
- Micro-frontend architecture

### Phase 3: Scale
- Edge deployment with Vercel Edge
- Advanced state management
- Real-time features with WebSockets

### Phase 4: Innovation
- AI-powered features
- Advanced personalization
- Progressive enhancement
