# Tài liệu Thông số Chức năng (FSD)
## Nền tảng E-commerce Multi-tenant

---

### Thông tin tài liệu

**Phiên bản**: 1.0  
**Ngày**: 22 tháng 1, 2026  
**Tác giả**: Đội ngũ Phát triển  
**Trạng thái**: Bản nháp  

---

### Phân loại Tính năng theo Modules

#### 1. Module Quản lý Danh tính & Truy cập

##### 1.1 Hệ thống Xác thực
**User Story**: Là người dùng, tôi muốn xác thực bảo mật với nhiều lựa chọn để có thể truy cập nền tảng một cách thuận tiện.

**Tiêu chí Chấp nhận**:
- Hỗ trợ xác thực email/password với bcrypt hashing
- Bật đăng nhập xã hội (Google, Facebook) với OAuth 2.0
- Triển khai xác thực hai yếu tố sử dụng TOTP
- Cung cấp chức năng đặt lại mật khẩu với xác thực email
- Hỗ trợ quản lý session với JWT tokens
- Bật chức năng ghi nhớ tôi với refresh tokens bảo mật

**Quy tắc Kinh doanh**:
- Password minimum 8 characters with complexity requirements
- Session timeout after 30 minutes of inactivity
- Maximum 5 failed login attempts before account lockout
- Social login accounts must be verified before access

##### 1.2 User Management
**User Story**: As a store owner, I want to manage user accounts and permissions so that I can control access to my store.

**Acceptance Criteria**:
- Create, read, update, delete user accounts
- Assign roles and permissions to users
- Bulk user import/export functionality
- User activity logging and audit trails
- Password policy enforcement
- Account status management (active/inactive/suspended)

**Business Rules**:
- Store owners can only manage users within their tenant
- Super admins can manage all platform users
- Deleted users are soft-deleted for audit purposes
- User email addresses must be unique within tenant

##### 1.3 Role-Based Access Control (RBAC)
**User Story**: As a platform administrator, I want to define roles and permissions so that I can enforce proper access control.

**Acceptance Criteria**:
- Create custom roles with granular permissions
- Assign permissions to roles (read, write, delete, admin)
- Role inheritance and hierarchy support
- Dynamic permission checking at runtime
- Permission templates for common use cases
- Audit logging for permission changes

**Business Rules**:
- System roles cannot be deleted, only modified
- At least one user must have admin permissions per tenant
- Permissions are cumulative (user gets all permissions from assigned roles)
- Critical operations require multi-factor authentication

---

#### 2. Catalog Management Module

##### 2.1 Product Management
**User Story**: As a store manager, I want to manage products and variants so that I can sell my inventory effectively.

**Acceptance Criteria**:
- Create products with multiple variants (size, color, etc.)
- Manage product information (name, description, images, pricing)
- Bulk product operations (import, export, update)
- Product categorization and tagging
- Inventory tracking per variant
- Product status management (draft, active, archived)

**Business Rules**:
- Product slugs must be unique within tenant
- Minimum one image required for active products
- Price cannot be negative
- Archived products remain in system for order history
- Product deletion requires confirmation and affects historical data

##### 2.2 Category Management
**User Story**: As a store owner, I want to organize products into categories so that customers can browse easily.

**Acceptance Criteria**:
- Create hierarchical category structures
- Assign products to multiple categories
- Category-specific display settings
- Category images and descriptions
- Category ordering and visibility controls
- SEO optimization for categories

**Business Rules**:
- Maximum category depth of 5 levels
- Category names must be unique within same parent
- Empty categories can be hidden automatically
- Category deletion moves products to parent category

##### 2.3 Brand Management
**User Story**: As a store manager, I want to manage brands so that I can organize products by manufacturer.

**Acceptance Criteria**:
- Create and manage brand profiles
- Assign products to brands
- Brand logos and descriptions
- Brand-specific filtering and search
- Brand statistics and reporting

**Business Rules**:
- Brand names must be unique within tenant
- Products can belong to only one brand
- Brand deletion unassigns products (sets to null)

---

#### 3. Sales & Order Management Module

##### 3.1 Shopping Cart
**User Story**: As a customer, I want to add products to cart and manage them so that I can purchase multiple items.

**Acceptance Criteria**:
- Add products to cart with quantity selection
- View cart contents with subtotal calculation
- Update item quantities and remove items
- Apply promotional codes and discounts
- Persistent cart across sessions (for logged users)
- Guest cart support with email capture

**Business Rules**:
- Cart expires after 30 days of inactivity
- Maximum 100 items per cart
- Inventory validation at checkout time
- Prices are recalculated at checkout (not stored in cart)
- Guest carts merge with user cart on login

##### 3.2 Order Processing
**User Story**: As a store owner, I want to process orders efficiently so that I can fulfill customer purchases.

**Acceptance Criteria**:
- Create orders from cart checkout
- Order status tracking (pending, processing, shipped, delivered, cancelled)
- Order fulfillment with partial shipping support
- Order modification and cancellation
- Order history and search
- Customer order notifications

**Business Rules**:
- Order numbers are unique and sequential per tenant
- Order cancellation only allowed before shipping
- Inventory is reserved at order creation
- Order data is immutable (corrections use new transactions)
- Orders older than 1 year cannot be modified

##### 3.3 Payment Processing
**User Story**: As a customer, I want to pay using multiple methods so that I can complete purchases conveniently.

**Acceptance Criteria**:
- Support multiple payment gateways (Stripe, PayPal, COD)
- Credit/debit card processing with tokenization
- Digital wallet support (Apple Pay, Google Pay)
- Bank transfer and installment options
- Payment status tracking and reconciliation
- Refund and partial refund processing

**Business Rules**:
- Payment information is never stored in plain text
- Failed payment attempts are logged and rate-limited
- Refunds must be processed within 90 days
- Payment gateway fees are calculated and tracked
- Multiple payment methods allowed per order

---

#### 4. Inventory & Warehouse Management Module

##### 4.1 Multi-Warehouse Inventory
**User Story**: As a store manager, I want to track inventory across multiple warehouses so that I can optimize stock levels.

**Acceptance Criteria**:
- Create and manage multiple warehouse locations
- Track inventory levels per warehouse and SKU
- Transfer inventory between warehouses
- Low stock alerts and reorder points
- Inventory adjustment and audit logging
- Real-time inventory synchronization

**Business Rules**:
- Each SKU must have inventory in at least one warehouse
- Warehouse transfers require approval
- Inventory adjustments require reason codes
- Physical inventory counts must be performed quarterly
- Negative inventory is not allowed

##### 4.2 Stock Management
**User Story**: As an operations manager, I want to manage stock levels efficiently so that I can prevent stockouts.

**Acceptance Criteria**:
- Automatic stock reservation on order placement
- Stock release on order cancellation
- Backorder management and notifications
- Stock movement history and reporting
- Forecasting and demand planning
- Supplier management and purchase orders

**Business Rules**:
- Stock is reserved immediately on order creation
- Backorders are allowed only for specific products
- Stock movements are immutable with audit trails
- Safety stock levels are configurable per product
- Purchase orders auto-generate based on reorder points

---

#### 5. Marketing & Promotions Module

##### 5.1 Promotion Engine
**User Story**: As a marketing manager, I want to create flexible promotions so that I can drive sales and customer engagement.

**Acceptance Criteria**:
- Create discount rules (percentage, fixed amount, free shipping)
- Set promotion conditions (minimum order, product categories, customer groups)
- Schedule promotions with start/end dates
- Stackable promotion rules with priority ordering
- Promotion usage limits and restrictions
- Promotion performance analytics

**Business Rules**:
- Promotions cannot overlap in ways that cause negative pricing
- Maximum discount is 100% of product price
- Promotion codes are case-insensitive
- Each customer can use promotion only once unless specified
- Expired promotions automatically become inactive

##### 5.2 Loyalty Program
**User Story**: As a store owner, I want to reward loyal customers so that I can increase retention and repeat purchases.

**Acceptance Criteria**:
- Points earning rules per purchase amount
- Points redemption system with conversion rates
- Tier-based loyalty benefits
- Points expiration and management
- Loyalty program analytics
- Customer communication for loyalty events

**Business Rules**:
- Points are earned on order completion (not placement)
- Points expire after 12 months of inactivity
- Points cannot be earned on tax or shipping
- Tier benefits are cumulative
- Points are refunded on order cancellation

---

#### 6. Analytics & Reporting Module

##### 6.1 Real-time Dashboard
**User Story**: As a store owner, I want to see real-time business metrics so that I can make informed decisions.

**Acceptance Criteria**:
- Revenue and sales metrics with date filters
- Customer acquisition and retention analytics
- Product performance and inventory insights
- Traffic and conversion rate tracking
- Customizable dashboard widgets
- Data export capabilities (CSV, PDF, Excel)

**Business Rules**:
- Dashboard data refreshes every 5 minutes
- Historical data available for 2 years
- Export is limited to 10,000 records per request
- Sensitive data is masked for non-admin users
- Dashboard preferences are saved per user

##### 6.2 Advanced Analytics
**User Story**: As a business analyst, I want to analyze trends and patterns so that I can identify growth opportunities.

**Acceptance Criteria**:
- Cohort analysis and customer segmentation
- Product recommendation engine
- Sales forecasting with machine learning
- A/B testing framework
- Custom report builder
- API access for analytics data

**Business Rules**:
- Analytics data is aggregated and anonymized
- Machine learning models retrain weekly
- A/B tests require minimum sample size
- Custom reports have execution time limits
- API access is rate-limited and authenticated

---

### Use Cases and Scenarios

#### UC-001: Customer Purchase Journey
**Actor**: Customer  
**Preconditions**: Customer is logged in, products are in stock  

**Main Flow**:
1. Customer searches for products using AI-powered search
2. Customer views product details and reviews
3. Customer adds products to cart
4. Customer applies promotional code
5. Customer proceeds to checkout
6. Customer selects shipping method
7. Customer chooses payment method
8. Customer completes payment
9. Customer receives order confirmation
10. Customer can track order status

**Alternative Flows**:
- Guest checkout without account creation
- Payment failure requiring retry
- Out of stock items during checkout
- Multiple shipping addresses

#### UC-002: Store Owner Daily Operations
**Actor**: Store Owner  
**Preconditions**: Store is configured, products exist  

**Main Flow**:
1. Owner logs into admin dashboard
2. Owner reviews daily sales summary
3. Owner processes new orders
4. Owner updates inventory levels
5. Owner responds to customer inquiries
6. Owner creates new promotion
7. Owner reviews analytics reports
8. Owner updates product information

**Alternative Flows**:
- Handling returns and refunds
- Managing stockouts and backorders
- Processing bulk orders
- Updating shipping configurations

---

### Business Rules Validation

#### Pricing Rules
- Base price cannot be negative
- Sale price cannot exceed base price
- Tax calculation follows local regulations
- Currency conversion uses real-time rates
- Minimum advertised price (MAP) policy enforcement

#### Inventory Rules
- Stock levels cannot be negative
- Reserved stock counts toward available inventory
- Safety stock levels prevent overselling
- Perishable items have expiration tracking
- Serial number tracking for high-value items

#### Order Rules
- Order total must match payment amount
- Shipping address validation required
- Digital products have no shipping
- Gift orders require recipient information
- Subscription orders have recurring billing

---

### Error Handling Requirements

#### Validation Errors
- Clear, actionable error messages
- Field-level validation feedback
- Form data preservation on errors
- Internationalized error messages
- Error logging for debugging

#### System Errors
- Graceful degradation for service failures
- Automatic retry mechanisms
- Fallback to cached data
- User notification of service issues
- Error recovery procedures

#### Business Logic Errors
- Inventory conflict resolution
- Payment failure handling
- Promotion rule conflicts
- Order state validation
- Data consistency checks

---

### Data Flow Specifications

#### Customer Registration Flow
```
Customer Input → Validation → Email Verification → Account Creation → Welcome Email → Dashboard Access
```

#### Order Processing Flow
```
Cart → Checkout → Payment → Inventory Reserve → Order Create → Fulfillment → Shipping → Completion
```

#### Inventory Update Flow
```
Product Update → Validation → Database Update → Cache Invalidation → Search Index Update → Notification
```

---

### Integration Requirements

#### Payment Gateway Integration
- PCI-DSS compliant payment processing
- Webhook handling for payment events
- Refund and dispute management
- Multi-currency support
- Tokenization for recurring payments

#### Shipping Carrier Integration
- Real-time rate calculation
- Label printing and tracking
- Multi-carrier comparison
- Address validation
- Return shipping management

#### Email Service Integration
- Transactional email templates
- Marketing campaign management
- Email analytics and tracking
- Unsubscribe management
- Spam compliance

---

### Performance Requirements

#### Response Time Requirements
- API responses: <500ms (95th percentile)
- Page loads: <2 seconds (average)
- Search results: <1 second
- Checkout process: <3 seconds total
- Dashboard loading: <5 seconds

#### Throughput Requirements
- Concurrent users: 10,000
- Orders per minute: 1,000
- API requests per second: 5,000
- Database transactions: 10,000/second
- File uploads: 100/second

#### Scalability Requirements
- Horizontal scaling with load balancing
- Database sharding capability
- CDN integration for static assets
- Auto-scaling based on demand
- Geographic distribution support

---

### Security Requirements

#### Authentication Security
- Password hashing with bcrypt
- JWT token with expiration
- OAuth 2.0 for third-party login
- Multi-factor authentication
- Session management security

#### Data Security
- Encryption at rest and in transit
- PII data masking and protection
- Audit logging for all data access
- Data retention policies
- Right to be forgotten implementation

#### API Security
- Rate limiting per user/IP
- API key authentication
- Request validation and sanitization
- CORS policy enforcement
- SQL injection prevention

---

### Testing Requirements

#### Unit Testing
- Minimum 80% code coverage
- All business logic tested
- Edge cases and error conditions
- Performance critical paths
- Security vulnerability testing

#### Integration Testing
- API endpoint testing
- Database integration testing
- Third-party service testing
- Payment gateway testing
- Email service testing

#### End-to-End Testing
- Critical user journeys
- Cross-browser compatibility
- Mobile responsiveness
- Performance testing
- Security testing

---

### Approval

**Functional Lead**: ___________________  
**Date**: ___________________  
**Signature**: ___________________  

**Technical Lead**: ___________________  
**Date**: ___________________  
**Signature**: ___________________  

**Business Owner**: ___________________  
**Date**: ___________________  
**Signature**: ___________________
