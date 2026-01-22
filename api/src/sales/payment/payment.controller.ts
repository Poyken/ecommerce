import { PrismaService } from '@core/prisma/prisma.service';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import * as crypto from 'crypto';
import * as querystring from 'qs';
import { VNPayUtils } from './vnpay.utils';

/**
 * =====================================================================
 * PAYMENT CONTROLLER - XỬ LÝ KẾT QUẢ THANH TOÁN (VNPAY, MOMO)
 * =====================================================================
 *
 * =====================================================================
 */
import { CommissionService } from '@/platform/analytics/commission.service';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly commissionService: CommissionService,
  ) {}

  @Get('vnpay_return')
  @ApiOperation({ summary: 'Handle VNPay Return URL' })
  async vnpayReturn(@Query() query: Record<string, any>, @Res() res) {
    const vnp_Params = { ...query };
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // Sort params
    const sortedParams = VNPayUtils.sortObject(vnp_Params);

    const secretKey = this.configService.get('VNPAY_HASH_SECRET');
    const signData = querystring.stringify(sortedParams, { encode: false });
    const isValid = VNPayUtils.verifySignature(secureHash, secretKey, signData);

    if (isValid) {
      const orderId = vnp_Params['vnp_TxnRef'];
      const responseCode = vnp_Params['vnp_ResponseCode'];

      if (responseCode === '00') {
        // Success -> Update Order Status immediately (good for local dev)
        await this.prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'PROCESSING',
            paymentStatus: 'PAID',
          },
        });

        // Calculate commissions/fees
        await this.commissionService.calculateForOrder(orderId).catch((e) => {
          this.logger.error(
            `Error calculating commission for order ${orderId}`,
            e,
          );
        });

        // H2 FIX: Dynamic locale from order/user preference
        const frontendUrl = this.configService.get('FRONTEND_URL');
        if (!frontendUrl) {
          this.logger.error('[CONFIG] FRONTEND_URL not set - cannot redirect');
          return res.status(500).send('Configuration error');
        }
        const locale = 'en'; // TODO: Extract from order.locale or user.locale

        return res.redirect(
          `${frontendUrl}/${locale}/order-success/${orderId}`,
        );
      } else {
        // Failed
        await this.prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'CANCELLED',
            paymentStatus: 'FAILED',
          },
        });

        const frontendUrl = this.configService.get('FRONTEND_URL');
        if (!frontendUrl) {
          this.logger.error('[CONFIG] FRONTEND_URL not set - cannot redirect');
          return res.status(500).send('Configuration error');
        }
        const locale = 'en'; // TODO: Extract from order.locale

        return res.redirect(`${frontendUrl}/${locale}/order-failed/${orderId}`);
      }
    } else {
      const frontendUrl = this.configService.get('FRONTEND_URL');
      if (!frontendUrl) {
        this.logger.error('[CONFIG] FRONTEND_URL not set - cannot redirect');
        return res.status(500).send('Configuration error');
      }

      return res.redirect(
        `${frontendUrl}/en/order-failed?reason=checksum_failed`,
      );
    }
  }

  @Get('vnpay_ipn')
  @ApiOperation({ summary: 'Handle VNPay IPN (Server to Server)' })
  async vnpayIpn(@Query() query: Record<string, any>) {
    const vnp_Params = { ...query };
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    const sortedParams = VNPayUtils.sortObject(vnp_Params);
    const secretKey = this.configService.get('VNPAY_HASH_SECRET');
    const signData = querystring.stringify(sortedParams, { encode: false });
    const isValid = VNPayUtils.verifySignature(secureHash, secretKey, signData);

    if (!isValid) {
      return { RspCode: '97', Message: 'Checksum failed' };
    }

    const orderId = vnp_Params['vnp_TxnRef'];
    const rspCode = vnp_Params['vnp_ResponseCode'];
    const webhookId =
      vnp_Params['vnp_TransactionNo'] || `vnpay_${orderId}_${Date.now()}`;
    const vnpPayDate = vnp_Params['vnp_PayDate']; // Format: YYYYMMDDHHmmss

    // B4: Timestamp validation - Reject webhooks older than 5 minutes
    if (vnpPayDate) {
      try {
        const year = parseInt(vnpPayDate.substring(0, 4));
        const month = parseInt(vnpPayDate.substring(4, 6)) - 1;
        const day = parseInt(vnpPayDate.substring(6, 8));
        const hour = parseInt(vnpPayDate.substring(8, 10));
        const minute = parseInt(vnpPayDate.substring(10, 12));
        const second = parseInt(vnpPayDate.substring(12, 14));
        const webhookTimestamp = new Date(
          year,
          month,
          day,
          hour,
          minute,
          second,
        ).getTime();
        const now = Date.now();
        const maxAge = 5 * 60 * 1000; // 5 minutes

        if (now - webhookTimestamp > maxAge) {
          return { RspCode: '99', Message: 'Webhook expired' };
        }
      } catch (e) {
        this.logger.warn(
          'Failed to parse vnp_PayDate for timestamp validation',
          e,
        );
      }
    }

    // B1 & B4: Idempotency check + Transaction with row locking
    try {
      const result = await this.prisma.$transaction(
        async (tx) => {
          // Check if webhook already processed (idempotency)
          const existingWebhook = await tx.webhookEvent.findUnique({
            where: { webhookId },
          });

          if (existingWebhook) {
            this.logger.warn(`Duplicate webhook detected: ${webhookId}`);
            return {
              RspCode: '02',
              Message: 'Webhook already processed (idempotent)',
            };
          }

          // Lock order row to prevent concurrent webhook processing
          const order = await tx.$queryRaw<any[]>`
          SELECT * FROM "Order" WHERE id = ${orderId} FOR UPDATE
        `;

          if (!order || order.length === 0) {
            await tx.webhookEvent.create({
              data: {
                webhookId,
                orderId,
                provider: 'VNPAY',
                status: 'FAILED',
                responseCode: rspCode,
                tenantId: 'unknown', // Will be overridden by Prisma middleware
              },
            });
            return { RspCode: '01', Message: 'Không tìm thấy đơn hàng' };
          }

          const orderData = order[0];

          // Check if order already processed
          if (orderData.status !== 'PENDING') {
            await tx.webhookEvent.create({
              data: {
                webhookId,
                orderId,
                provider: 'VNPAY',
                status: 'IGNORED',
                responseCode: rspCode,
                tenantId: orderData.tenantId,
              },
            });
            return {
              RspCode: '02',
              Message: 'Đơn hàng đã được xác nhận trước đó',
            };
          }

          if (rspCode === '00') {
            // Payment Success - Update order AND create webhook event atomically
            await tx.order.update({
              where: { id: orderId },
              data: {
                status: 'PROCESSING',
                paymentStatus: 'PAID',
              },
            });

            // Create webhook event record
            await tx.webhookEvent.create({
              data: {
                webhookId,
                orderId,
                provider: 'VNPAY',
                status: 'PROCESSED',
                responseCode: rspCode,
                tenantId: orderData.tenantId,
              },
            });

            // B1 FIX: Calculate commission INSIDE transaction
            try {
              await this.commissionService.calculateForOrder(orderId);
            } catch (e) {
              this.logger.error(
                `Lỗi khi tính toán hoa hồng cho đơn hàng ${orderId} (IN TRANSACTION)`,
                e,
              );
              // Don't throw - commission can be recalculated later
            }

            return { RspCode: '00', Message: 'Thành công' };
          } else {
            // Payment Failed
            await tx.order.update({
              where: { id: orderId },
              data: {
                status: 'CANCELLED',
                paymentStatus: 'FAILED',
              },
            });

            await tx.webhookEvent.create({
              data: {
                webhookId,
                orderId,
                provider: 'VNPAY',
                status: 'PROCESSED',
                responseCode: rspCode,
                tenantId: orderData.tenantId,
              },
            });

            return { RspCode: '00', Message: 'Thành công' };
          }
        },
        {
          isolationLevel: 'Serializable', // Highest isolation to prevent race conditions
          maxWait: 5000,
          timeout: 10000,
        },
      );

      return result;
    } catch (error) {
      this.logger.error('VNPay IPN transaction failed', error);
      return { RspCode: '99', Message: 'System error' };
    }
  }

  @Post('momo_ipn')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle MoMo IPN (Server to Server)' })
  async momoIpn(@Body() body: Record<string, any>) {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = body;

    const secretKey = this.configService.get('MOMO_SECRET_KEY');
    const accessKey = this.configService.get('MOMO_ACCESS_KEY');

    if (!secretKey) {
      return { message: 'Chưa cấu hình MOMO_SECRET_KEY' };
    }

    // MoMo IPN signature raw string format
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData || ''}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

    // Note: MoMo IPN signature validation might differ slightly by version/requestType.
    // This is the standard captureWallet version.
    const hmac = crypto.createHmac('sha256', secretKey);
    const expectedSignature = hmac.update(rawSignature).digest('hex');

    if (signature === expectedSignature) {
      const webhookId = `momo_${requestId}`;

      try {
        return await this.prisma.$transaction(
          async (tx) => {
            // 1. Idempotency Check
            const existingWebhook = await tx.webhookEvent.findUnique({
              where: { webhookId },
            });

            if (existingWebhook) {
              this.logger.warn(`Duplicate MoMo webhook detected: ${webhookId}`);
              return { message: 'Thành công (Duplicate)' };
            }

            // 2. Lock Order (Row-level lock)
            const order = await tx.$queryRaw<any[]>`
              SELECT * FROM "Order" WHERE id = ${orderId} FOR UPDATE
            `;

            if (!order || order.length === 0) {
              // Log failed attempt
              await tx.webhookEvent.create({
                data: {
                  webhookId,
                  orderId,
                  provider: 'MOMO',
                  status: 'FAILED',
                  responseCode: resultCode.toString(),
                  tenantId: 'unknown',
                },
              });
              return { message: 'Không tìm thấy đơn hàng' };
            }

            const orderData = order[0];

            // 3. Check Order Status (Prevent double processing)
            if (orderData.status !== 'PENDING') {
              await tx.webhookEvent.create({
                data: {
                  webhookId,
                  orderId,
                  provider: 'MOMO',
                  status: 'IGNORED',
                  responseCode: resultCode.toString(),
                  tenantId: orderData.tenantId,
                },
              });
              return { message: 'Đơn hàng đã được xử lý trước đó' };
            }

            // 4. Update Status & Create Webhook Event
            if (resultCode === 0) {
              await tx.order.update({
                where: { id: orderId },
                data: {
                  status: 'PROCESSING',
                  paymentStatus: 'PAID',
                  transactionId: transId.toString(),
                },
              });

              await tx.webhookEvent.create({
                data: {
                  webhookId,
                  orderId,
                  provider: 'MOMO',
                  status: 'PROCESSED',
                  responseCode: resultCode.toString(),
                  tenantId: orderData.tenantId,
                },
              });

              // 5. Calculate Commission (Safe in potential retry due to transaction)
              try {
                await this.commissionService.calculateForOrder(orderId);
              } catch (e) {
                this.logger.error(
                  `Error calculating commission for order ${orderId} (MOMO)`,
                  e,
                );
              }
            } else {
              // Payment Failed
              await tx.order.update({
                where: { id: orderId },
                data: {
                  status: 'CANCELLED',
                  paymentStatus: 'FAILED',
                },
              });

              await tx.webhookEvent.create({
                data: {
                  webhookId,
                  orderId,
                  provider: 'MOMO',
                  status: 'PROCESSED',
                  responseCode: resultCode.toString(),
                  tenantId: orderData.tenantId,
                },
              });
            }

            return { message: 'Thành công' };
          },
          {
            isolationLevel: 'Serializable',
            timeout: 10000,
          },
        );
      } catch (error) {
        this.logger.error('MoMo IPN transaction failed', error);
        return { message: 'Lỗi hệ thống' };
      }
    } else {
      return { message: 'Chữ ký không khớp (Signature mismatch)' };
    }
  }
}
