# Tài liệu Hợp đồng API
## Nền tảng E-commerce Multi-tenant

---

### Thông tin tài liệu

**Phiên bản**: 1.0  
**Ngày**: 22 tháng 1, 2026  
**Tác giả**: Đội ngũ Phát triển  
**Trạng thái**: Bản nháp  
**Phiên bản API**: v1  
**URL Cơ sở**: `https://api.ecommerce.com/api/v1`

---

### Tổng quan về API

#### Nguyên tắc Kiến trúc

1. **Thiết kế RESTful**: HTTP methods và status codes phù hợp
2. **Hỗ trợ Multi-tenant**: Cách ly tenant qua headers/subdomains
3. **Phiên bản hóa**: Phiên bản hóa dựa trên URL (`/api/v1/`)
4. **Phản hồi Nhất quán**: Định dạng phản hồi tiêu chuẩn hóa
5. **Xử lý Lỗi**: Báo cáo lỗi toàn diện
6. **Giới hạn Tốc độ**: Throttling theo tenant và người dùng

#### Xác thực

```http
Authorization: Bearer <jwt_token>
X-Tenant-ID: <tenant_uuid>
```

#### Standard Headers

```http
Content-Type: application/json
Accept: application/json
X-Request-ID: <correlation_id>
X-Client-Version: <client_version>
```

---

### Response Format Standards

#### Success Response

```typescript
interface ApiResponse<T> {
  data: T;
  meta: {
    total?: number;
    page?: number;
    limit?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
  links?: {
    self: string;
    first?: string;
    last?: string;
    next?: string;
    prev?: string;
  };
  timestamp: string;
  requestId: string;
}
```

#### Error Response

```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
    field?: string;
    timestamp: string;
    path: string;
    requestId: string;
  };
}
```

#### Paginated Response

```typescript
interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

---

### Authentication Endpoints

#### POST /auth/register
Register a new user account.

**Request Body:**
```typescript
interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  acceptTerms: boolean;
  marketingConsent?: boolean;
}
```

**Response (201):**
```typescript
interface RegisterResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    emailVerified: boolean;
    createdAt: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}
```

**Error Codes:**
- `EMAIL_ALREADY_EXISTS`: Email already registered
- `INVALID_EMAIL`: Invalid email format
- `WEAK_PASSWORD`: Password doesn't meet requirements
- `TERMS_NOT_ACCEPTED`: Terms must be accepted

#### POST /auth/login
Authenticate user and return tokens.

**Request Body:**
```typescript
interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}
```

**Response (200):**
```typescript
interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions: string[];
    tenantId: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}
```

**Error Codes:**
- `INVALID_CREDENTIALS`: Invalid email or password
- `ACCOUNT_LOCKED`: Account is temporarily locked
- `ACCOUNT_INACTIVE`: Account is not active
- `EMAIL_NOT_VERIFIED`: Email address not verified

#### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```typescript
interface RefreshRequest {
  refreshToken: string;
}
```

**Response (200):**
```typescript
interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
```

#### POST /auth/logout
Logout user and invalidate tokens.

**Request Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (204):** No content

#### POST /auth/forgot-password
Initiate password reset process.

**Request Body:**
```typescript
interface ForgotPasswordRequest {
  email: string;
}
```

**Response (200):**
```typescript
interface ForgotPasswordResponse {
  message: string;
  resetToken: string; // Only in development
}
```

#### POST /auth/reset-password
Reset password using reset token.

**Request Body:**
```typescript
interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}
```

**Response (200):**
```typescript
interface ResetPasswordResponse {
  message: string;
}
```

---

### User Management Endpoints

#### GET /users/profile
Get current user profile.

**Authentication:** Required  
**Response (200):**
```typescript
interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  permissions: string[];
  avatar?: string;
  preferences: {
    language: string;
    currency: string;
    timezone: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

#### PUT /users/profile
Update current user profile.

**Request Body:**
```typescript
interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  preferences?: {
    language?: string;
    currency?: string;
    timezone?: string;
  };
}
```

**Response (200):** Updated user profile

#### POST /users/change-password
Change user password.

**Request Body:**
```typescript
interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
```

**Response (200):**
```typescript
interface ChangePasswordResponse {
  message: string;
}
```

#### GET /users
List users (admin only).

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `search`: Search by name or email
- `role`: Filter by role
- `isActive`: Filter by active status
- `sortBy`: Sort field (name, email, createdAt)
- `sortOrder`: Sort direction (asc, desc)

**Response (200):** Paginated list of users

#### POST /users
Create new user (admin only).

**Request Body:**
```typescript
interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  password?: string;
  phone?: string;
  isActive?: boolean;
  sendInvite?: boolean;
}
```

**Response (201):** Created user data

---

### Product Management Endpoints

#### GET /products
List products with filtering and pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `search`: Search term (name, description, SKU)
- `category`: Filter by category ID
- `brand`: Filter by brand ID
- `status`: Filter by status (active, inactive, draft)
- `priceMin`: Minimum price filter
- `priceMax`: Maximum price filter
- `sortBy`: Sort field (name, price, createdAt, sortOrder)
- `sortOrder`: Sort direction (asc, desc)

**Response (200):**
```typescript
interface ProductListResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    filters: {
      categories: Category[];
      brands: Brand[];
      priceRange: {
        min: number;
        max: number;
      };
    };
  };
}
```

#### GET /products/:id
Get product details by ID or slug.

**Path Parameters:**
- `id`: Product UUID or slug

**Response (200):**
```typescript
interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  images: string[];
  price: {
    base: number;
    sale?: number;
    currency: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  brand?: {
    id: string;
    name: string;
    slug: string;
  };
  skus: SKU[];
  options: ProductOption[];
  inventory: {
    inStock: boolean;
    totalStock: number;
    lowStock: boolean;
  };
  reviews: {
    averageRating: number;
    count: number;
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  createdAt: string;
  updatedAt: string;
}
```

#### POST /products
Create new product (admin only).

**Request Body:**
```typescript
interface CreateProductRequest {
  name: string;
  slug?: string;
  description: string;
  shortDescription?: string;
  images: string[];
  categoryId: string;
  brandId?: string;
  basePrice: number;
  salePrice?: number;
  costPrice?: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  tags: string[];
  options: ProductOption[];
  skus: CreateSKURequest[];
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  status: 'draft' | 'active' | 'inactive';
}
```

**Response (201):** Created product data

#### PUT /products/:id
Update product (admin only).

**Request Body:** Same as create product (all fields optional)

**Response (200):** Updated product data

#### DELETE /products/:id
Delete product (admin only).

**Response (204):** No content (soft delete)

#### GET /products/:id/variants
Get product variants/SKUs.

**Response (200):** List of SKUs with inventory data

#### POST /products/:id/variants
Create product variant (admin only).

**Request Body:**
```typescript
interface CreateSKURequest {
  sku: string;
  barcode?: string;
  price: number;
  comparePrice?: number;
  costPrice?: number;
  weight?: number;
  attributes: Record<string, string>;
  images?: string[];
  trackInventory: boolean;
}
```

---

### Category Management Endpoints

#### GET /categories
List categories with hierarchy.

**Query Parameters:**
- `includeInactive`: Include inactive categories
- `level`: Filter by hierarchy level
- `parent`: Filter by parent category

**Response (200):**
```typescript
interface CategoryListResponse {
  data: Category[];
  hierarchy: Record<string, string[]>;
}
```

#### GET /categories/:id
Get category details.

**Response (200):**
```typescript
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  level: number;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}
```

#### POST /categories
Create new category (admin only).

**Request Body:**
```typescript
interface CreateCategoryRequest {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  parentId?: string;
  sortOrder?: number;
  isActive?: boolean;
}
```

#### PUT /categories/:id
Update category (admin only).

#### DELETE /categories/:id
Delete category (admin only).

---

### Cart Management Endpoints

#### GET /cart
Get current user's cart.

**Authentication:** Required  
**Response (200):**
```typescript
interface Cart {
  id: string;
  items: CartItem[];
  totals: {
    subtotal: number;
    taxAmount: number;
    shippingAmount: number;
    discountAmount: number;
    total: number;
    currency: string;
  };
  currency: string;
  createdAt: string;
  updatedAt: string;
}

interface CartItem {
  id: string;
  skuId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    images: string[];
  };
  sku: {
    id: string;
    sku: string;
    price: number;
    attributes: Record<string, string>;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  addedAt: string;
}
```

#### POST /cart/items
Add item to cart.

**Request Body:**
```typescript
interface AddCartItemRequest {
  skuId: string;
  quantity: number;
}
```

**Response (201):** Updated cart

#### PUT /cart/items/:id
Update cart item quantity.

**Request Body:**
```typescript
interface UpdateCartItemRequest {
  quantity: number;
}
```

**Response (200):** Updated cart

#### DELETE /cart/items/:id
Remove item from cart.

**Response (200):** Updated cart

#### POST /cart/apply-promo
Apply promotional code.

**Request Body:**
```typescript
interface ApplyPromoRequest {
  code: string;
}
```

**Response (200):**
```typescript
interface ApplyPromoResponse {
  cart: Cart;
  promo: {
    id: string;
    name: string;
    code: string;
    discountAmount: number;
    type: 'percentage' | 'fixed';
  };
}
```

#### DELETE /cart/promo
Remove promotional code.

**Response (200):** Updated cart

---

### Order Management Endpoints

#### GET /orders
List user orders with filtering.

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status
- `dateFrom`: Filter by date range (from)
- `dateTo`: Filter by date range (to)
- `sortBy`: Sort field
- `sortOrder`: Sort direction

**Response (200):** Paginated list of orders

#### GET /orders/:id
Get order details.

**Response (200):**
```typescript
interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  currency: string;
  items: OrderItem[];
  totals: {
    subtotal: number;
    taxAmount: number;
    shippingAmount: number;
    discountAmount: number;
    total: number;
  };
  shippingAddress: Address;
  billingAddress: Address;
  payments: Payment[];
  shipments: Shipment[];
  notes?: string;
  orderDate: string;
  shippedDate?: string;
  deliveredDate?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### POST /orders
Create order from cart.

**Request Body:**
```typescript
interface CreateOrderRequest {
  shippingAddress: Address;
  billingAddress?: Address;
  paymentMethod: string;
  shippingMethod: string;
  promoCode?: string;
  notes?: string;
}
```

**Response (201):** Created order data

#### POST /orders/:id/cancel
Cancel order.

**Request Body:**
```typescript
interface CancelOrderRequest {
  reason: string;
  refundItems?: string[];
}
```

**Response (200):** Updated order status

---

### Payment Endpoints

#### GET /payments/methods
Get available payment methods.

**Response (200):**
```typescript
interface PaymentMethodsResponse {
  methods: PaymentMethod[];
}

interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'bank' | 'wallet' | 'cod';
  icon: string;
  enabled: boolean;
  config: {
    supportedCards?: string[];
    currencies?: string[];
    fees?: Record<string, number>;
  };
}
```

#### POST /payments/process
Process payment for order.

**Request Body:**
```typescript
interface ProcessPaymentRequest {
  orderId: string;
  methodId: string;
  paymentData: {
    cardNumber?: string;
    expiryMonth?: string;
    expiryYear?: string;
    cvv?: string;
    saveCard?: boolean;
    // Method-specific fields
  };
}
```

**Response (200):**
```typescript
interface ProcessPaymentResponse {
  payment: Payment;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  redirectUrl?: string; // For external payment methods
  threeDSecure?: {
    required: boolean;
    url?: string;
  };
}
```

#### POST /payments/:id/refund
Process refund.

**Request Body:**
```typescript
interface RefundRequest {
  amount?: number; // Full refund if not specified
  reason: string;
}
```

**Response (200):** Refund details

---

### Search Endpoints

#### GET /search/products
Search products with advanced filters.

**Query Parameters:**
- `q`: Search query
- `page`: Page number
- `limit`: Items per page
- `category`: Category filter
- `brand`: Brand filter
- `priceMin`: Minimum price
- `priceMax`: Maximum price
- `inStock`: Only in-stock products
- `onSale`: Only sale products
- `sortBy`: Sort relevance, price, name, date
- `sortOrder`: Sort direction
- `facets`: Include facet counts

**Response (200):**
```typescript
interface SearchResponse {
  results: Product[];
  facets: {
    categories: FacetOption[];
    brands: FacetOption[];
    priceRanges: FacetOption[];
    attributes: Record<string, FacetOption[]>;
  };
  suggestions: string[];
  meta: {
    total: number;
    page: number;
    limit: number;
    query: string;
    searchTime: number;
  };
}
```

#### GET /search/suggestions
Get search suggestions.

**Query Parameters:**
- `q`: Partial query
- `limit`: Number of suggestions

**Response (200):**
```typescript
interface SuggestionsResponse {
  suggestions: {
    type: 'product' | 'category' | 'brand' | 'query';
    text: string;
    url?: string;
    count?: number;
  }[];
}
```

#### GET /search/ai
AI-powered semantic search.

**Request Body:**
```typescript
interface AISearchRequest {
  query: string;
  filters?: Record<string, any>;
  limit?: number;
}
```

**Response (200):**
```typescript
interface AISearchResponse {
  results: Product[];
  explanation?: string;
  confidence: number;
  relatedQueries: string[];
}
```

---

### Admin Endpoints

#### GET /admin/dashboard
Get dashboard statistics.

**Authentication:** Admin required  
**Response (200):**
```typescript
interface DashboardStats {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    averageOrderValue: number;
  };
  trends: {
    revenue: TrendData[];
    orders: TrendData[];
    customers: TrendData[];
  };
  topProducts: ProductSales[];
  recentOrders: Order[];
  alerts: DashboardAlert[];
}
```

#### GET /admin/analytics/sales
Get sales analytics.

**Query Parameters:**
- `period`: Time period (day, week, month, year)
- `dateFrom`: Custom date range start
- `dateTo`: Custom date end
- `groupBy`: Grouping dimension (day, week, month, category, brand)

**Response (200):** Sales analytics data

#### GET /admin/analytics/products
Get product analytics.

**Response (200):** Product performance metrics

#### GET /admin/analytics/customers
Get customer analytics.

**Response (200):** Customer behavior and segmentation data

---

### Webhook Endpoints

#### POST /webhooks/payment
Handle payment gateway webhooks.

**Request Headers:**
```http
X-Webhook-Signature: <hmac_signature>
X-Webhook-Source: <gateway_name>
```

**Request Body:** Gateway-specific payload

#### POST /webhooks/shipping
Handle shipping carrier webhooks.

#### POST /webhooks/events
Platform event webhooks for tenants.

---

### Error Codes Reference

#### Authentication Errors (4xx)

| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | No authentication provided |
| `INVALID_TOKEN` | 401 | Invalid or expired token |
| `INSUFFICIENT_PERMISSIONS` | 403 | User lacks required permissions |
| `ACCOUNT_LOCKED` | 423 | Account is temporarily locked |
| `EMAIL_NOT_VERIFIED` | 403 | Email address not verified |

#### Validation Errors (4xx)

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `INVALID_INPUT` | 400 | Invalid input data |
| `MISSING_REQUIRED_FIELD` | 400 | Required field is missing |
| `INVALID_FORMAT` | 400 | Field format is invalid |
| `DUPLICATE_VALUE` | 409 | Value already exists |

#### Business Logic Errors (4xx)

| Code | HTTP | Description |
|------|------|-------------|
| `INSUFFICIENT_STOCK` | 400 | Not enough inventory |
| `CART_EXPIRED` | 400 | Shopping cart has expired |
| `PROMO_EXPIRED` | 400 | Promotional code has expired |
| `ORDER_NOT_CANCELLABLE` | 400 | Order cannot be cancelled |
| `PAYMENT_FAILED` | 400 | Payment processing failed |

#### System Errors (5xx)

| Code | HTTP | Description |
|------|------|-------------|
| `INTERNAL_ERROR` | 500 | Internal server error |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `EXTERNAL_SERVICE_ERROR` | 502 | External service unavailable |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

---

### Rate Limiting

#### Rate Limits by Endpoint

| Endpoint Type | Limit | Window | Per |
|---------------|-------|--------|-----|
| Authentication | 10 | 1 minute | IP |
| Search | 100 | 1 minute | User |
| Product Browse | 1000 | 1 hour | Tenant |
| Order Creation | 10 | 1 minute | User |
| Admin API | 500 | 1 hour | User |

#### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642778800
```

---

### API Versioning Strategy

#### Versioning Approach

1. **URL Versioning**: `/api/v1/`, `/api/v2/`
2. **Semantic Versioning**: Major.Minor.Patch
3. **Backward Compatibility**: Maintain previous version for 12 months
4. **Deprecation Headers**: Warn clients about upcoming changes

#### Deprecation Process

```http
Sunset: Tue, 01 Jan 2027 00:00:00 GMT
Deprecation: true
Link: </api/v2/products>; rel="successor-version"
```

---

### Testing and Documentation

#### API Testing

1. **Unit Tests**: Endpoint logic validation
2. **Integration Tests**: Database and external service integration
3. **Contract Tests**: API contract compliance
4. **Load Tests**: Performance under load

#### Documentation Generation

- **OpenAPI/Swagger**: Auto-generated from code annotations
- **Postman Collection**: Exportable API collection
- **SDK Generation**: Client library generation

#### Example Requests

```bash
# Product search
curl -X GET "https://api.ecommerce.com/api/v1/products?search=laptop&category=electronics&priceMin=500&priceMax=2000" \
  -H "X-Tenant-ID: 550e8400-e29b-41d4-a716-446655440001"

# Create order
curl -X POST "https://api.ecommerce.com/api/v1/orders" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddress": {
      "firstName": "John",
      "lastName": "Doe",
      "address1": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "US"
    },
    "paymentMethod": "stripe",
    "shippingMethod": "standard"
  }'
```

---

### Approval

**API Architect**: ___________________  
**Date**: ___________________  
**Signature**: ___________________  

**Lead Developer**: ___________________  
**Date**: ___________________  
**Signature**: ___________________  

**QA Lead**: ___________________  
**Date**: ___________________  
**Signature**: ___________________
