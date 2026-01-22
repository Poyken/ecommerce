# Hướng dẫn Tích hợp Bên thứ ba
## Nền tảng E-commerce Multi-tenant

---

### Thông tin tài liệu

**Phiên bản**: 1.0  
**Ngày**: 22 tháng 1, 2026  
**Tác giả**: Đội ngũ Integration  
**Trạng thái**: Bản nháp  

---

### Tổng quan về Tích hợp

#### Triết lý Tích hợp

1. **API-First**: Tất cả tích hợp thông qua API
2. **Secure First**: Bảo mật là ưu tiên hàng đầu
3. **Multi-Tenant Ready**: Hỗ trợ nhiều tenant
4. **Scalable**: Có thể mở rộng dễ dàng
5. **Maintainable**: Dễ bảo trì và cập nhật

#### Phân loại Tích hợp

**1. Payment Gateways**
- Stripe, PayPal, Square
- Bank transfers
- Digital wallets

**2. Shipping Providers**
- FedEx, UPS, DHL
- Local couriers
- Real-time tracking

**3. Email/SMS Services**
- SendGrid, Mailgun
- Twilio, Vonage
- Push notifications

**4. Analytics & Tracking**
- Google Analytics
- Mixpanel, Segment
- Custom analytics

**5. Cloud Storage**
- AWS S3, Google Cloud
- CDN integration
- Image optimization

---

### Payment Gateway Integration

#### Stripe Integration

**1. Configuration**
```typescript
// src/integrations/payment/stripe.config.ts
import Stripe from 'stripe';

export const stripeConfig = {
  apiVersion: '2023-10-16',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  supportedMethods: ['card', 'alipay', 'sepa_debit'],
  currencies: ['USD', 'EUR', 'GBP', 'VND'],
};

export class StripeService {
  private stripe: Stripe;
  
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: stripeConfig.apiVersion,
    });
  }

  async createPaymentIntent(
    tenantId: string,
    amount: number,
    currency: string,
    metadata: Record<string, string>
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata: {
          tenantId,
          ...metadata
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return paymentIntent;
    } catch (error) {
      throw new Error(`Stripe payment intent creation failed: ${error.message}`);
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.confirm(paymentIntentId);
    } catch (error) {
      throw new Error(`Payment confirmation failed: ${error.message}`);
    }
  }

  async refundPayment(
    paymentIntentId: string,
    amount?: number
  ): Promise<Stripe.Refund> {
    try {
      return await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
      });
    } catch (error) {
      throw new Error(`Refund failed: ${error.message}`);
    }
  }

  async createCustomer(
    tenantId: string,
    email: string,
    name: string
  ): Promise<Stripe.Customer> {
    try {
      return await this.stripe.customers.create({
        email,
        name,
        metadata: { tenantId },
      });
    } catch (error) {
      throw new Error(`Customer creation failed: ${error.message}`);
    }
  }

  async handleWebhook(
    signature: string,
    payload: string
  ): Promise<Stripe.Event> {
    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        stripeConfig.webhookSecret
      );
    } catch (error) {
      throw new Error(`Webhook verification failed: ${error.message}`);
    }
  }
}
```

**2. Webhook Handler**
```typescript
// src/integrations/payment/stripe.webhook.ts
import { StripeService } from './stripe.config';
import { OrderService } from '../../orders/order.service';
import { NotificationService } from '../../notifications/notification.service';

export class StripeWebhookHandler {
  constructor(
    private stripeService: StripeService,
    private orderService: OrderService,
    private notificationService: NotificationService
  ) {}

  async handleEvent(signature: string, payload: string): Promise<void> {
    try {
      const event = await this.stripeService.handleWebhook(signature, payload);
      
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'charge.dispute.created':
          await this.handleDispute(event.data.object as Stripe.Dispute);
          break;
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Webhook handling failed:', error);
      throw error;
    }
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const tenantId = paymentIntent.metadata.tenantId;
    const orderId = paymentIntent.metadata.orderId;

    // Update order status
    await this.orderService.updateOrderStatus(orderId, 'paid');

    // Send confirmation
    await this.notificationService.sendPaymentConfirmation(
      tenantId,
      orderId,
      paymentIntent.id
    );

    console.log(`Payment succeeded for order ${orderId}`);
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const tenantId = paymentIntent.metadata.tenantId;
    const orderId = paymentIntent.metadata.orderId;

    // Update order status
    await this.orderService.updateOrderStatus(orderId, 'payment_failed');

    // Send notification
    await this.notificationService.sendPaymentFailure(
      tenantId,
      orderId,
      paymentIntent.last_payment_error?.message
    );

    console.log(`Payment failed for order ${orderId}`);
  }

  private async handleDispute(dispute: Stripe.Dispute): Promise<void> {
    // Handle chargeback disputes
    const chargeId = dispute.charge as string;
    
    // Find associated order
    const order = await this.orderService.findOrderByChargeId(chargeId);
    
    if (order) {
      await this.orderService.updateOrderStatus(order.id, 'disputed');
      
      // Notify admin
      await this.notificationService.sendDisputeNotification(
        order.tenantId,
        order.id,
        dispute.reason
      );
    }
  }
}
```

#### PayPal Integration

**1. PayPal Service**
```typescript
// src/integrations/payment/paypal.service.ts
import axios from 'axios';

export class PayPalService {
  private baseURL: string;
  private clientId: string;
  private clientSecret: string;
  private accessToken: string;

  constructor() {
    this.baseURL = process.env.PAYPAL_ENVIRONMENT === 'sandbox' 
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';
    this.clientId = process.env.PAYPAL_CLIENT_ID;
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken && !this.isTokenExpired()) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          auth: {
            username: this.clientId,
            password: this.clientSecret,
          },
          headers: {
            'Accept': 'application/json',
            'Accept-Language': 'en_US',
          },
        }
      );

      this.accessToken = response.data.access_token;
      return this.accessToken;
    } catch (error) {
      throw new Error(`PayPal authentication failed: ${error.message}`);
    }
  }

  async createOrder(
    tenantId: string,
    amount: number,
    currency: string,
    returnUrl: string,
    cancelUrl: string
  ): Promise<any> {
    const accessToken = await this.getAccessToken();

    try {
      const response = await axios.post(
        `${this.baseURL}/v2/checkout/orders`,
        {
          intent: 'CAPTURE',
          purchase_units: [
            {
              amount: {
                currency_code: currency,
                value: amount.toFixed(2),
              },
              custom_id: tenantId,
            },
          ],
          application_context: {
            return_url: returnUrl,
            cancel_url: cancelUrl,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`PayPal order creation failed: ${error.message}`);
    }
  }

  async capturePayment(orderId: string): Promise<any> {
    const accessToken = await this.getAccessToken();

    try {
      const response = await axios.post(
        `${this.baseURL}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`PayPal payment capture failed: ${error.message}`);
    }
  }

  private isTokenExpired(): boolean {
    // Implement token expiration check
    return false;
  }
}
```

---

### Shipping Provider Integration

#### FedEx Integration

**1. FedEx Service**
```typescript
// src/integrations/shipping/fedex.service.ts
import axios from 'axios';
import crypto from 'crypto';

export class FedExService {
  private baseURL: string;
  private apiKey: string;
  private secretKey: string;
  private accountNumber: string;

  constructor() {
    this.baseURL = process.env.FEDEX_ENVIRONMENT === 'test'
      ? 'https://wsbeta.fedex.com:443/web-services'
      : 'https://ws.fedex.com:443/web-services';
    this.apiKey = process.env.FEDEX_API_KEY;
    this.secretKey = process.env.FEDEX_SECRET_KEY;
    this.accountNumber = process.env.FEDEX_ACCOUNT_NUMBER;
  }

  async createShipment(
    tenantId: string,
    shipmentData: ShipmentData
  ): Promise<FedExShipment> {
    try {
      const authHeader = this.generateAuthHeader();
      
      const requestBody = {
        requestedShipment: {
          shipper: {
            contact: {
              personName: shipmentData.shipper.name,
              companyName: shipmentData.shipper.company,
              phoneNumber: shipmentData.shipper.phone,
            },
            address: shipmentData.shipper.address,
          },
          recipients: [
            {
              contact: {
                personName: shipmentData.recipient.name,
                companyName: shipmentData.recipient.company,
                phoneNumber: shipmentData.recipient.phone,
              },
              address: shipmentData.recipient.address,
            },
          ],
          serviceType: this.getServiceType(shipmentData.service),
          packageCount: shipmentData.packages.length,
          requestedPackageLineItems: shipmentData.packages.map(pkg => ({
            weight: {
              units: 'KG',
              value: pkg.weight,
            },
            dimensions: {
              length: pkg.length,
              width: pkg.width,
              height: pkg.height,
              units: 'CM',
            },
          })),
          totalWeight: {
            units: 'KG',
            value: shipmentData.packages.reduce((sum, pkg) => sum + pkg.weight, 0),
          },
        },
      };

      const response = await axios.post(
        `${this.baseURL}/ship`,
        requestBody,
        {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'X-locale': 'en_US',
          },
        }
      );

      return {
        trackingNumber: response.data.completedShipmentDetail.masterTrackingNumber,
        labelData: response.data.completedShipmentDetail.completedPackageDetails[0].label.parts[0].image,
        serviceType: shipmentData.service,
        estimatedDelivery: response.data.completedShipmentDetail.operationalDetail.deliveryDate,
      };
    } catch (error) {
      throw new Error(`FedEx shipment creation failed: ${error.message}`);
    }
  }

  async trackShipment(trackingNumber: string): Promise<TrackingInfo> {
    try {
      const authHeader = this.generateAuthHeader();
      
      const response = await axios.get(
        `${this.baseURL}/track/${trackingNumber}`,
        {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        trackingNumber,
        status: response.data.output.trackResults[0].trackResults[0].latestStatusDetail.description,
        estimatedDelivery: response.data.output.trackResults[0].trackResults[0].dateAndTimes[0].dateTime,
        events: response.data.output.trackResults[0].trackResults[0].scanEvents.map(event => ({
          timestamp: event.date,
          location: event.scanLocation,
          status: event.eventDescription,
        })),
      };
    } catch (error) {
      throw new Error(`FedEx tracking failed: ${error.message}`);
    }
  }

  async getRates(
    origin: Address,
    destination: Address,
    packages: Package[]
  ): Promise<ShippingRate[]> {
    try {
      const authHeader = this.generateAuthHeader();
      
      const requestBody = {
        rateRequest: {
          requestedShipment: {
            shipper: { address: origin },
            recipients: [{ address: destination }],
            serviceType: 'FEDEX_GROUND',
            packageCount: packages.length,
            requestedPackageLineItems: packages.map(pkg => ({
              weight: { units: 'KG', value: pkg.weight },
              dimensions: {
                length: pkg.length,
                width: pkg.width,
                height: pkg.height,
                units: 'CM',
              },
            })),
          },
        },
      };

      const response = await axios.post(
        `${this.baseURL}/rate`,
        requestBody,
        {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.output.rateReplyDetails.map(rate => ({
        serviceType: rate.serviceType,
        totalCharge: parseFloat(rate.ratedShipmentDetails[0].totalNetChargeWithDutiesAndTaxes),
        deliveryDate: rate.deliveryTimestamp,
      }));
    } catch (error) {
      throw new Error(`FedEx rate calculation failed: ${error.message}`);
    }
  }

  private generateAuthHeader(): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(`${this.apiKey}${timestamp}`)
      .digest('hex');
    
    return `FedEx ${this.apiKey}:${signature}:${timestamp}`;
  }

  private getServiceType(service: string): string {
    const serviceMap = {
      'ground': 'FEDEX_GROUND',
      'express': 'FEDEX_EXPRESS_SAVER',
      'overnight': 'FEDEX_OVERNIGHT',
    };
    
    return serviceMap[service] || 'FEDEX_GROUND';
  }
}

interface ShipmentData {
  shipper: ShipperInfo;
  recipient: RecipientInfo;
  service: string;
  packages: Package[];
}

interface Package {
  weight: number;
  length: number;
  width: number;
  height: number;
}

interface FedExShipment {
  trackingNumber: string;
  labelData: string;
  serviceType: string;
  estimatedDelivery: string;
}

interface TrackingInfo {
  trackingNumber: string;
  status: string;
  estimatedDelivery: string;
  events: TrackingEvent[];
}

interface TrackingEvent {
  timestamp: string;
  location: string;
  status: string;
}

interface ShippingRate {
  serviceType: string;
  totalCharge: number;
  deliveryDate: string;
}
```

---

### Email & SMS Integration

#### SendGrid Integration

**1. Email Service**
```typescript
// src/integrations/communication/sendgrid.service.ts
import sgMail from '@sendgrid/mail';

export class SendGridService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }

  async sendEmail(
    tenantId: string,
    to: string[],
    templateId: string,
    dynamicData: Record<string, any>
  ): Promise<void> {
    try {
      const msg = {
        to,
        from: `noreply@${tenantId}.ecommerce-platform.com`,
        templateId,
        dynamicTemplateData: {
          ...dynamicData,
          tenantId,
          platformName: 'E-commerce Platform',
        },
      };

      await sgMail.send(msg);
      console.log(`Email sent to ${to.join(', ')} using template ${templateId}`);
    } catch (error) {
      throw new Error(`SendGrid email failed: ${error.message}`);
    }
  }

  async sendOrderConfirmation(
    tenantId: string,
    customerEmail: string,
    orderData: OrderConfirmationData
  ): Promise<void> {
    await this.sendEmail(
      tenantId,
      [customerEmail],
      process.env.SENDGRID_ORDER_CONFIRMATION_TEMPLATE,
      {
        customerName: orderData.customerName,
        orderNumber: orderData.orderNumber,
        orderDate: orderData.orderDate,
        items: orderData.items,
        totalAmount: orderData.totalAmount,
        shippingAddress: orderData.shippingAddress,
        trackingNumber: orderData.trackingNumber,
      }
    );
  }

  async sendPasswordReset(
    tenantId: string,
    userEmail: string,
    resetToken: string
  ): Promise<void> {
    await this.sendEmail(
      tenantId,
      [userEmail],
      process.env.SENDGRID_PASSWORD_RESET_TEMPLATE,
      {
        resetLink: `https://${tenantId}.ecommerce-platform.com/reset-password?token=${resetToken}`,
        expirationHours: 24,
      }
    );
  }

  async sendMarketingEmail(
    tenantId: string,
    recipients: string[],
    campaignData: MarketingCampaignData
  ): Promise<void> {
    await this.sendEmail(
      tenantId,
      recipients,
      process.env.SENDGRID_MARKETING_TEMPLATE,
      {
        campaignName: campaignData.name,
        subject: campaignData.subject,
        content: campaignData.content,
        unsubscribeLink: `https://${tenantId}.ecommerce-platform.com/unsubscribe`,
      }
    );
  }
}

interface OrderConfirmationData {
  customerName: string;
  orderNumber: string;
  orderDate: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: Address;
  trackingNumber?: string;
}

interface MarketingCampaignData {
  name: string;
  subject: string;
  content: string;
}
```

#### Twilio Integration

**1. SMS Service**
```typescript
// src/integrations/communication/twilio.service.ts
import twilio from 'twilio';

export class TwilioService {
  private client: twilio.Twilio;

  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  async sendSMS(
    tenantId: string,
    to: string,
    message: string
  ): Promise<void> {
    try {
      const from = process.env.TWILIO_PHONE_NUMBER;
      
      await this.client.messages.create({
        body: message,
        from,
        to,
      });

      console.log(`SMS sent to ${to} for tenant ${tenantId}`);
    } catch (error) {
      throw new Error(`Twilio SMS failed: ${error.message}`);
    }
  }

  async sendOrderStatusUpdate(
    tenantId: string,
    customerPhone: string,
    orderNumber: string,
    status: string
  ): Promise<void> {
    const message = `Your order #${orderNumber} has been updated to: ${status}. Track your order at https://${tenantId}.ecommerce-platform.com/orders/${orderNumber}`;
    
    await this.sendSMS(tenantId, customerPhone, message);
  }

  async sendVerificationCode(
    tenantId: string,
    userPhone: string,
    code: string
  ): Promise<void> {
    const message = `Your verification code for ${tenantId}.ecommerce-platform.com is: ${code}. This code expires in 10 minutes.`;
    
    await this.sendSMS(tenantId, userPhone, message);
  }

  async sendShippingNotification(
    tenantId: string,
    customerPhone: string,
    trackingNumber: string,
    carrier: string
  ): Promise<void> {
    const message = `Your order has shipped! Tracking: ${trackingNumber} (${carrier}). Track at https://${tenantId}.ecommerce-platform.com/track/${trackingNumber}`;
    
    await this.sendSMS(tenantId, customerPhone, message);
  }
}
```

---

### Analytics Integration

#### Google Analytics

**1. Analytics Service**
```typescript
// src/integrations/analytics/google-analytics.service.ts
import { AnalyticsData } from '@google-analytics/data';

export class GoogleAnalyticsService {
  private analyticsData: AnalyticsData;

  constructor() {
    this.analyticsData = new AnalyticsData({
      auth: this.getAuthClient(),
    });
  }

  async trackEvent(
    tenantId: string,
    eventName: string,
    parameters: Record<string, any>
  ): Promise<void> {
    try {
      // Send event to Google Analytics 4
      await this.analyticsData.properties.runReport({
        property: `properties/${process.env.GA4_PROPERTY_ID}`,
        dimensions: [
          { name: 'eventName' },
          { name: 'tenantId' },
        ],
        metrics: [
          { name: 'eventCount' },
        ],
        dateRanges: [{ startDate: 'today', endDate: 'today' }],
        dimensionFilter: {
          andGroup: {
            expressions: [
              {
                dimension: 'eventName',
                stringFilter: { value: eventName },
              },
              {
                dimension: 'tenantId',
                stringFilter: { value: tenantId },
              },
            ],
          },
        },
      });

      console.log(`GA4 event tracked: ${eventName} for tenant ${tenantId}`);
    } catch (error) {
      throw new Error(`GA4 tracking failed: ${error.message}`);
    }
  }

  async trackPurchase(
    tenantId: string,
    purchaseData: PurchaseData
  ): Promise<void> {
    await this.trackEvent(tenantId, 'purchase', {
      transaction_id: purchaseData.orderId,
      value: purchaseData.totalAmount,
      currency: purchaseData.currency,
      items: purchaseData.items.map(item => ({
        item_id: item.productId,
        item_name: item.name,
        category: item.category,
        quantity: item.quantity,
        price: item.price,
      })),
    });
  }

  async trackPageView(
    tenantId: string,
    page: string,
    userId?: string
  ): Promise<void> {
    await this.trackEvent(tenantId, 'page_view', {
      page_location: page,
      user_id: userId,
    });
  }

  async getTenantAnalytics(
    tenantId: string,
    startDate: string,
    endDate: string
  ): Promise<AnalyticsReport> {
    try {
      const response = await this.analyticsData.properties.runReport({
        property: `properties/${process.env.GA4_PROPERTY_ID}`,
        dimensions: [
          { name: 'eventName' },
          { name: 'date' },
        ],
        metrics: [
          { name: 'eventCount' },
          { name: 'totalRevenue' },
        ],
        dateRanges: [{ startDate, endDate }],
        dimensionFilter: {
          dimension: 'tenantId',
          stringFilter: { value: tenantId },
        },
      });

      return {
        totalEvents: response.rows.reduce((sum, row) => sum + parseInt(row.metricValues[0]), 0),
        totalRevenue: response.rows.reduce((sum, row) => sum + parseFloat(row.metricValues[1] || 0), 0),
        topEvents: response.rows.map(row => ({
          eventName: row.dimensionValues[0],
          count: parseInt(row.metricValues[0]),
        })),
      };
    } catch (error) {
      throw new Error(`GA4 analytics retrieval failed: ${error.message}`);
    }
  }

  private getAuthClient(): any {
    // Implement Google Auth client
    return null;
  }
}

interface PurchaseData {
  orderId: string;
  totalAmount: number;
  currency: string;
  items: PurchaseItem[];
}

interface PurchaseItem {
  productId: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
}

interface AnalyticsReport {
  totalEvents: number;
  totalRevenue: number;
  topEvents: Array<{
    eventName: string;
    count: number;
  }>;
}
```

---

### Cloud Storage Integration

#### AWS S3 Integration

**1. S3 Service**
```typescript
// src/integrations/storage/s3.service.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.bucketName = process.env.AWS_S3_BUCKET_NAME;
  }

  async uploadFile(
    tenantId: string,
    fileKey: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<string> {
    try {
      const key = `${tenantId}/${fileKey}`;
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        Metadata: {
          tenantId,
        },
      });

      await this.s3Client.send(command);
      
      return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
    } catch (error) {
      throw new Error(`S3 upload failed: ${error.message}`);
    }
  }

  async getPresignedUrl(
    tenantId: string,
    fileKey: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const key = `${tenantId}/${fileKey}`;
      
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      throw new Error(`S3 presigned URL generation failed: ${error.message}`);
    }
  }

  async deleteFile(tenantId: string, fileKey: string): Promise<void> {
    try {
      const key = `${tenantId}/${fileKey}`;
      
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      throw new Error(`S3 deletion failed: ${error.message}`);
    }
  }

  async uploadProductImage(
    tenantId: string,
    productId: string,
    imageBuffer: Buffer,
    filename: string
  ): Promise<string> {
    const fileKey = `products/${productId}/${filename}`;
    return this.uploadFile(tenantId, fileKey, imageBuffer, 'image/jpeg');
  }

  async uploadDocument(
    tenantId: string,
    documentType: string,
    documentBuffer: Buffer,
    filename: string
  ): Promise<string> {
    const fileKey = `documents/${documentType}/${filename}`;
    return this.uploadFile(tenantId, fileKey, documentBuffer, 'application/pdf');
  }
}
```

---

### Integration Management

#### Integration Registry

**1. Integration Manager**
```typescript
// src/integrations/integration-manager.ts
export class IntegrationManager {
  private integrations: Map<string, any> = new Map();

  constructor() {
    this.registerIntegrations();
  }

  private registerIntegrations(): void {
    // Payment integrations
    this.integrations.set('stripe', new StripeService());
    this.integrations.set('paypal', new PayPalService());

    // Shipping integrations
    this.integrations.set('fedex', new FedExService());
    this.integrations.set('ups', new UPSService());

    // Communication integrations
    this.integrations.set('sendgrid', new SendGridService());
    this.integrations.set('twilio', new TwilioService());

    // Analytics integrations
    this.integrations.set('google-analytics', new GoogleAnalyticsService());

    // Storage integrations
    this.integrations.set('s3', new S3Service());
  }

  getIntegration(name: string): any {
    const integration = this.integrations.get(name);
    if (!integration) {
      throw new Error(`Integration not found: ${name}`);
    }
    return integration;
  }

  async processPayment(
    tenantId: string,
    provider: string,
    paymentData: PaymentData
  ): Promise<PaymentResult> {
    const paymentService = this.getIntegration(`${provider}-payment`);
    return await paymentService.processPayment(tenantId, paymentData);
  }

  async createShipment(
    tenantId: string,
    provider: string,
    shipmentData: ShipmentData
  ): Promise<ShipmentResult> {
    const shippingService = this.getIntegration(`${provider}-shipping`);
    return await shippingService.createShipment(tenantId, shipmentData);
  }

  async sendNotification(
    tenantId: string,
    type: 'email' | 'sms',
    provider: string,
    notificationData: NotificationData
  ): Promise<void> {
    const service = this.getIntegration(`${provider}-${type}`);
    await service.send(tenantId, notificationData);
  }

  async trackAnalytics(
    tenantId: string,
    provider: string,
    eventData: AnalyticsData
  ): Promise<void> {
    const analyticsService = this.getIntegration(`${provider}-analytics`);
    await analyticsService.track(tenantId, eventData);
  }

  async uploadFile(
    tenantId: string,
    provider: string,
    fileData: FileData
  ): Promise<string> {
    const storageService = this.getIntegration(`${provider}-storage`);
    return await storageService.upload(tenantId, fileData);
  }
}

interface PaymentData {
  amount: number;
  currency: string;
  method: string;
  orderId: string;
}

interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

interface ShipmentResult {
  trackingNumber: string;
  labelUrl: string;
  estimatedDelivery: string;
}

interface NotificationData {
  to: string[];
  template?: string;
  data: Record<string, any>;
}

interface AnalyticsData {
  event: string;
  parameters: Record<string, any>;
}

interface FileData {
  key: string;
  buffer: Buffer;
  contentType: string;
}
```

---

### Configuration Management

**1. Integration Config**
```typescript
// src/integrations/config/integration.config.ts
export interface IntegrationConfig {
  enabled: boolean;
  credentials: Record<string, string>;
  settings: Record<string, any>;
  rateLimits?: {
    requestsPerSecond: number;
    requestsPerHour: number;
  };
  retryPolicy?: {
    maxAttempts: number;
    backoffMs: number;
  };
}

export const integrationConfigs: Record<string, IntegrationConfig> = {
  stripe: {
    enabled: true,
    credentials: {
      apiKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
    settings: {
      apiVersion: '2023-10-16',
      supportedMethods: ['card', 'alipay'],
    },
    rateLimits: {
      requestsPerSecond: 100,
      requestsPerHour: 10000,
    },
    retryPolicy: {
      maxAttempts: 3,
      backoffMs: 1000,
    },
  },
  
  sendgrid: {
    enabled: true,
    credentials: {
      apiKey: process.env.SENDGRID_API_KEY,
    },
    settings: {
      defaultFrom: 'noreply@ecommerce-platform.com',
    },
    rateLimits: {
      requestsPerSecond: 10,
      requestsPerHour: 1000,
    },
  },
  
  twilio: {
    enabled: true,
    credentials: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    },
    rateLimits: {
      requestsPerSecond: 1,
      requestsPerHour: 100,
    },
  },
};
```

---

### Error Handling & Monitoring

**1. Integration Error Handler**
```typescript
// src/integrations/error-handler.ts
export class IntegrationErrorHandler {
  async handleIntegrationError(
    integrationName: string,
    error: Error,
    context: Record<string, any>
  ): Promise<void> {
    // Log error
    console.error(`Integration error in ${integrationName}:`, error, context);

    // Send alert to monitoring system
    await this.sendAlert(integrationName, error, context);

    // Check if integration should be disabled
    if (await this.shouldDisableIntegration(integrationName, error)) {
      await this.disableIntegration(integrationName);
    }
  }

  private async sendAlert(
    integrationName: string,
    error: Error,
    context: Record<string, any>
  ): Promise<void> {
    // Send to monitoring system (Sentry, etc.)
  }

  private async shouldDisableIntegration(
    integrationName: string,
    error: Error
  ): Promise<boolean> {
    // Implement logic to determine if integration should be disabled
    return error.message.includes('authentication failed');
  }

  private async disableIntegration(integrationName: string): Promise<void> {
    // Disable integration temporarily
    console.log(`Disabling integration: ${integrationName}`);
  }
}
```

---

### Testing & Validation

**1. Integration Tests**
```typescript
// tests/integrations/payment.test.ts
describe('Payment Integration Tests', () => {
  let stripeService: StripeService;

  beforeEach(() => {
    stripeService = new StripeService();
  });

  describe('Stripe Integration', () => {
    it('should create payment intent', async () => {
      const result = await stripeService.createPaymentIntent(
        'tenant-123',
        100.00,
        'USD',
        { orderId: 'order-123' }
      );

      expect(result).toBeDefined();
      expect(result.status).toBe('requires_payment_method');
    });

    it('should handle webhook events', async () => {
      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123',
            metadata: { tenantId: 'tenant-123', orderId: 'order-123' },
          },
        },
      };

      // Test webhook handling
      expect(true).toBe(true); // Placeholder
    });
  });
});
```

---

### Approval

**Integration Lead**: ___________________  
**Ngày**: ___________________  
**Chữ ký**: ___________________

**DevOps Lead**: ___________________  
**Ngày**: ___________________  
**Chữ ký**: ___________________

**Tech Lead**: ___________________  
**Ngày**: ___________________  
**Chữ ký**: ___________________
