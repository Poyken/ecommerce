# Business Flows Reference

Tài liệu này mô tả các luồng nghiệp vụ chính của hệ thống Ecommerce.

---

## 1. Customer Journey

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Browse  │ → │   Cart   │ → │ Checkout │ → │  Payment │ → │  Order   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
     │                                               │               │
     ▼                                               ▼               ▼
┌──────────┐                                  ┌──────────┐    ┌──────────┐
│  Review  │                                  │   Fail   │    │ Shipping │
└──────────┘                                  └──────────┘    └──────────┘
```

### 1.1 Browse → Cart

- User truy cập storefront (via Tenant subdomain/domain)
- Duyệt Categories, Brands, Products
- Filter theo Price, Rating
- Thêm SKU vào Cart (gọi API `POST /cart/items`)

### 1.2 Checkout Flow

1. User click "Checkout"
2. Chọn/Thêm Address
3. Chọn Shipping Method (GHN/GHTK integration)
4. Áp dụng Promotion Code (nếu có)
5. Chọn Payment Method

### 1.3 Payment Flow

- **COD**: Tạo Order với status PENDING, payment UNPAID
- **MOMO/VNPAY**: Redirect → Callback → Update Payment status
- **Stripe**: Client-side → Confirm → Webhook → Update

### 1.4 Order Fulfillment

```
PENDING → PROCESSING → SHIPPED → DELIVERED → COMPLETED
                ↓
           CANCELLED
```

---

## 2. Admin Operations

### 2.1 Catalog Management

```
Create Brand → Create Category → Create Product → Create SKUs → Upload Images
                                      │
                                      ▼
                              Add ProductOptions (Color, Size)
                                      │
                                      ▼
                              Create OptionValues (Red, Blue, S, M, L)
                                      │
                                      ▼
                              Link SKUs to OptionValues
```

### 2.2 Inventory Flow

```
Create Warehouse → Create InventoryItem (SKU + Warehouse) → Set minStockLevel
                                      │
                     ┌────────────────┼────────────────┐
                     ▼                ▼                ▼
               PurchaseOrder    Sale (Order)     Manual Adjust
                     │                │                │
                     ▼                ▼                ▼
               InventoryLog    InventoryLog     InventoryLog
```

### 2.3 Promotion Setup

```
Create Promotion
       │
       ├── Add PromotionRules (MIN_ORDER_VALUE >= 500000)
       │
       └── Add PromotionActions (DISCOUNT_PERCENT: 10%)
```

---

## 3. RMA (Return) Flow

```
Customer Request     Admin Review      Return Process      Refund
     │                    │                  │                │
     ▼                    ▼                  ▼                ▼
┌──────────┐      ┌──────────────┐    ┌───────────┐    ┌──────────┐
│ PENDING  │  →   │  APPROVED/   │ →  │ RECEIVED  │ →  │ REFUNDED │
│          │      │  REJECTED    │    │ INSPECTING│    │          │
└──────────┘      └──────────────┘    └───────────┘    └──────────┘
```

---

## 4. Multi-Tenant Flow

### Tenant Onboarding

```
1. User đăng ký tài khoản
2. Tạo Tenant (subdomain, plan)
3. Onboarding Wizard:
   - Step 0: Thông tin cơ bản
   - Step 1: Upload Logo
   - Step 2: Cấu hình Shipping
   - Step 3: Thêm Products đầu tiên
   - Step 4: Kích hoạt Store
```

### Tenant Data Isolation

- Mọi query PHẢI có `WHERE tenantId = ?`
- Middleware tự động inject `tenantId` từ request context
- Guards validate tenant access trước khi xử lý

---

## 5. Loyalty Points Flow

```
Order Completed → Calculate Points (orderTotal / loyaltyPointRatio)
                        │
                        ▼
                  LoyaltyPoint (type: EARNED)
                        │
         ┌──────────────┴──────────────┐
         ▼                             ▼
   Redeem at Checkout           Points Expire
         │                             │
         ▼                             ▼
   LoyaltyPoint (REDEEMED)      Auto cleanup job
```
