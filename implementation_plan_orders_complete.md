# Implementation Plan - Complete Order Lifecycle

Refactor the order lifecycle to include Inventory Synchronization, Notifications, and Frontend Integration using Clean Architecture and Event-Driven patterns.

## 1. Phase 1: Inventory Synchronization (Event-Driven)

**Goal**: Ensure stock is accurately reserved when orders are placed and restored when cancelled.

### 1.1 Events Initialization

- Create `api/src/sales/orders/domain/events/order-placed.event.ts`.
- Create `api/src/sales/orders/domain/events/order-cancelled.event.ts`.

### 1.2 Event Handlers

- Implement `api/src/inventory/application/handlers/order-events.handler.ts`:
  - `handleOrderPlaced`: Decrease stock for each SKU in the order.
  - `handleOrderCancelled`: Increase stock back.
- Register handler in `InventoryModule`.

### 1.3 Use Case Updates

- Update `PlaceOrderUseCase` to emit `OrderPlacedEvent`.
- Update `CancelOrderUseCase` to emit `OrderCancelledEvent`.

## 2. Phase 2: User Notifications

**Goal**: Notify users of order status changes in real-time.

### 2.1 Event Handling

- Create `api/src/notifications/application/handlers/order-notifications.handler.ts`.
- Listen to `OrderPlacedEvent`, `OrderCancelledEvent`, and `OrderStatusUpdatedEvent`.
- Call `NotificationsService` to send Push/In-app/Email notifications.

## 3. Phase 3: Frontend Integration (Next.js)

**Goal**: Connect the Checkout UI to the new backend API.

### 3.1 Checkout Page Update

- Modify `web/app/[locale]/(shop)/checkout/checkout-client.tsx`:
  - Update `onSubmit` to match the new `CreateOrderDto` schema (passing full item snapshots).
  - Handle the response (redirect to success page or payment URL).

### 3.2 Order Tracking

- Verify `GetOrder` and `ListOrders` usage in user profile pages.

## 4. Verification Plan

- [ ] Test Order placement -> Stock decreases.
- [ ] Test Order cancellation -> Stock restored.
- [ ] Test real-time notification received on status update.
- [ ] E2E check: Checkout from Frontend -> Order visible in Admin dashboard.
