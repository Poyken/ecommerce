/**
 * =====================================================================
 * WEBHOOK SERVICE - HỆ THỐNG GỬI SỰ KIỆN ĐẾN BÊN THỨ BA
 * =====================================================================
 *
 * =====================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { createHmac } from 'crypto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export enum WebhookEvent {
  // Order Events
  ORDER_CREATED = 'order.created',
  ORDER_UPDATED = 'order.updated',
  ORDER_CANCELLED = 'order.cancelled',
  ORDER_SHIPPED = 'order.shipped',
  ORDER_DELIVERED = 'order.delivered',

  // Payment Events
  PAYMENT_SUCCESS = 'payment.success',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',

  // Product Events
  PRODUCT_CREATED = 'product.created',
  PRODUCT_UPDATED = 'product.updated',
  PRODUCT_DELETED = 'product.deleted',
  STOCK_LOW = 'stock.low',

  // Customer Events
  CUSTOMER_CREATED = 'customer.created',
  CUSTOMER_UPDATED = 'customer.updated',
}

export interface WebhookPayload {
  id: string;
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, any>;
  tenantId?: string;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  secret: string;
  events: WebhookEvent[];
  isActive: boolean;
  tenantId: string;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly MAX_RETRIES = 5;
  private readonly TIMEOUT_MS = 10000;

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('webhook-queue') private readonly webhookQueue: Queue,
  ) {}

  /**
   * Trigger a webhook event
   * Events are queued for async processing
   */
  async trigger(
    event: WebhookEvent,
    data: Record<string, any>,
    tenantId?: string,
  ): Promise<void> {
    const payload: WebhookPayload = {
      id: this.generateEventId(),
      event,
      timestamp: new Date().toISOString(),
      data,
      tenantId,
    };

    // Find all endpoints subscribed to this event
    const endpoints = this.getSubscribedEndpoints(event, tenantId);

    if (endpoints.length === 0) {
      this.logger.debug(`No endpoints subscribed to ${event}`);
      return;
    }

    // Queue webhooks for async delivery
    for (const endpoint of endpoints) {
      await this.webhookQueue.add(
        'deliver',
        {
          payload,
          endpoint,
          attempt: 1,
        },
        {
          attempts: this.MAX_RETRIES,
          backoff: {
            type: 'exponential',
            delay: 1000, // Start with 1 second
          },
          removeOnComplete: 100,
          removeOnFail: 1000,
        },
      );
    }

    this.logger.log(
      `📤 Webhook ${event} queued for ${endpoints.length} endpoints`,
    );
  }

  /**
   * Deliver webhook to endpoint (called by queue processor)
   */
  async deliver(
    payload: WebhookPayload,
    endpoint: WebhookEndpoint,
  ): Promise<{ success: boolean; statusCode?: number; error?: string }> {
    const signature = this.generateSignature(payload, endpoint.secret);

    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': payload.event,
          'X-Webhook-Id': payload.id,
          'X-Webhook-Timestamp': payload.timestamp,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.TIMEOUT_MS),
      });

      if (response.ok) {
        this.logger.log(
          `✅ Webhook delivered: ${payload.event} -> ${endpoint.url}`,
        );
        this.logDelivery(payload, endpoint, 'success', response.status);
        return { success: true, statusCode: response.status };
      } else {
        this.logger.warn(
          `⚠️ Webhook failed: ${payload.event} -> ${endpoint.url} (${response.status})`,
        );
        this.logDelivery(payload, endpoint, 'failed', response.status);
        return { success: false, statusCode: response.status };
      }
    } catch (error) {
      this.logger.error(
        `❌ Webhook error: ${payload.event} -> ${endpoint.url}`,
        error,
      );
      this.logDelivery(payload, endpoint, 'error', null, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate HMAC-SHA256 signature for payload verification
   */
  private generateSignature(payload: WebhookPayload, secret: string): string {
    const hmac = createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Verify incoming webhook signature (for receiving webhooks)
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(
      JSON.parse(payload),
      secret,
    );
    return signature === expectedSignature;
  }

  /**
   * Get endpoints subscribed to an event
   */
  private getSubscribedEndpoints(
    event: WebhookEvent,
    tenantId?: string,
  ): WebhookEndpoint[] {
    // In production, fetch from database
    // For now, return empty array (endpoints need to be configured)
    // TODO: Implement WebhookEndpoint model in Prisma
    return [];
  }

  /**
   * Log webhook delivery for audit
   */
  private logDelivery(
    payload: WebhookPayload,
    endpoint: WebhookEndpoint,
    status: 'success' | 'failed' | 'error',
    statusCode?: number | null,
    errorMessage?: string,
  ): void {
    // TODO: Store in database for audit trail
    this.logger.debug({
      webhookId: payload.id,
      event: payload.event,
      endpointUrl: endpoint.url,
      status,
      statusCode,
      errorMessage,
    });
  }

  private generateEventId(): string {
    return `whevt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // =====================================================================
  // CONVENIENCE METHODS
  // =====================================================================

  async onOrderCreated(order: any, tenantId?: string) {
    await this.trigger(WebhookEvent.ORDER_CREATED, { order }, tenantId);
  }

  async onOrderUpdated(order: any, tenantId?: string) {
    await this.trigger(WebhookEvent.ORDER_UPDATED, { order }, tenantId);
  }

  async onPaymentSuccess(payment: any, tenantId?: string) {
    await this.trigger(WebhookEvent.PAYMENT_SUCCESS, { payment }, tenantId);
  }

  async onStockLow(sku: any, tenantId?: string) {
    await this.trigger(
      WebhookEvent.STOCK_LOW,
      {
        skuId: sku.id,
        skuCode: sku.skuCode,
        currentStock: sku.stock,
        productName: sku.product?.name,
      },
      tenantId,
    );
  }
}
