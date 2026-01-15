# Checklist Logic Nghiệp Vụ Ecommerce

## Product Management

### Tạo/Sửa Sản phẩm

- [ ] Validate required fields (name, price, SKU)
- [ ] SKU unique trong hệ thống
- [ ] Price > 0
- [ ] Images được upload và optimize
- [ ] Categories/tags được gán đúng
- [ ] SEO meta được điền

### Inventory

- [ ] Stock quantity chính xác
- [ ] Low stock alerts configured
- [ ] Out of stock handling
- [ ] Backorder logic (nếu có)

## Pricing & Promotions

### Giá

- [ ] Base price
- [ ] Sale price (compare at price)
- [ ] Variant-specific pricing
- [ ] Tax calculation
- [ ] Currency handling

### Coupons

- [ ] Discount type (% hoặc fixed)
- [ ] Minimum order value
- [ ] Max uses per user
- [ ] Expiration date
- [ ] Applicable products/categories

## Cart & Checkout

### Cart

- [ ] Add/remove/update items
- [ ] Quantity limits
- [ ] Stock validation real-time
- [ ] Price calculation accurate
- [ ] Guest cart handling
- [ ] Cart persistence

### Checkout

- [ ] Shipping address validation
- [ ] Billing address (if different)
- [ ] Shipping methods available
- [ ] Payment methods available
- [ ] Order summary accurate
- [ ] Coupon application

## Order Management

### Order Creation

- [ ] Unique order number
- [ ] Stock decrement
- [ ] Payment capture
- [ ] Confirmation email
- [ ] Order history update

### Order Status Flow

```
Pending → Confirmed → Processing → Shipped → Delivered
                ↓
            Cancelled
                ↓
            Refunded
```

- [ ] Status transitions valid
- [ ] Notifications at each step
- [ ] Admin can update status
- [ ] Customer can track order

### Returns & Refunds

- [ ] Return policy enforced
- [ ] Return request workflow
- [ ] Refund calculation
- [ ] Inventory restoration
- [ ] Refund confirmation

## Payment Integration

- [ ] Multiple payment methods
- [ ] Payment failure handling
- [ ] Retry logic
- [ ] Webhook processing
- [ ] Transaction logging
- [ ] Fraud detection (nếu có)

## User Experience

### Search

- [ ] Product search accurate
- [ ] Filters work correctly
- [ ] Sort options
- [ ] No results handling

### Wishlist

- [ ] Add/remove items
- [ ] Move to cart
- [ ] Share wishlist
- [ ] Out of stock notification

### Reviews

- [ ] Rating validation (1-5)
- [ ] Review moderation
- [ ] Verified purchase badge
- [ ] Helpful votes
