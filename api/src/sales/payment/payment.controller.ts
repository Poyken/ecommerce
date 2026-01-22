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
        await (this.prisma.order as any).update({
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

        return res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:3000'}/en/order-success/${orderId}`,
        );
      } else {
        // Failed
        await (this.prisma.order as any).update({
          where: { id: orderId },
          data: {
            status: 'CANCELLED',
            paymentStatus: 'FAILED',
          },
        });

        return res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:3000'}/en/order-failed/${orderId}`,
        );
      }
    } else {
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/en/order-failed?reason=checksum_failed`,
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

    if (isValid) {
      const orderId = vnp_Params['vnp_TxnRef'];
      const rspCode = vnp_Params['vnp_ResponseCode'];

      // Find Order
      const order = await (this.prisma.order as any).findUnique({
        where: { id: orderId },
      });
      if (!order) {
        return { RspCode: '01', Message: 'Không tìm thấy đơn hàng' };
      }

      // Kiểm tra xem đơn đã thanh toán chưa
      if (order.status !== 'PENDING') {
        return { RspCode: '02', Message: 'Đơn hàng đã được xác nhận trước đó' };
      }

      if (rspCode === '00') {
        // Payment Success -> Update Order Status
        await (this.prisma.order as any).update({
          where: { id: orderId },
          data: {
            status: 'PROCESSING', // Paid orders go to PROCESSING (or configured flow)
            paymentStatus: 'PAID',
          },
        });

        // Tính toán hoa hồng và phí nền tảng
        await this.commissionService.calculateForOrder(orderId).catch((e) => {
          this.logger.error(
            `Lỗi khi tính toán hoa hồng cho đơn hàng ${orderId}`,
            e,
          );
        });

        return { RspCode: '00', Message: 'Thành công' };
      } else {
        // Payment Failed
        await (this.prisma.order as any).update({
          where: { id: orderId },
          data: {
            status: 'CANCELLED',
            paymentStatus: 'FAILED',
          },
        });
        return { RspCode: '00', Message: 'Thành công' };
      }
    } else {
      return { RspCode: '97', Message: 'Checksum failed' };
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
      // Find Order
      const order = await (this.prisma.order as any).findUnique({
        where: { id: orderId },
      });
      if (!order) {
        return { message: 'Không tìm thấy đơn hàng' };
      }

      if (resultCode === 0) {
        // Success
        await (this.prisma.order as any).update({
          where: { id: orderId },
          data: {
            status: 'PROCESSING',
            paymentStatus: 'PAID',
            transactionId: transId.toString(),
          },
        });

        // Calculate commissions/fees
        await this.commissionService.calculateForOrder(orderId).catch((e) => {
          this.logger.error(
            `Error calculating commission for order ${orderId}`,
            e,
          );
        });
      } else {
        // Failed
        await (this.prisma.order as any).update({
          where: { id: orderId },
          data: {
            status: 'CANCELLED',
            paymentStatus: 'FAILED',
          },
        });
      }
      return { message: 'Thành công' };
    } else {
      return { message: 'Chữ ký không khớp (Signature mismatch)' };
    }
  }
}
