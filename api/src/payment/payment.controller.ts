import { PrismaService } from '@core/prisma/prisma.service';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. RETURN URL (Trang phản hồi):
 * - Đây là nơi người dùng được chuyển hướng về sau khi thanh toán xong trên web của đối tác.
 * - Ta dùng nó để Redirect người dùng về trang "Thành công" hoặc "Thất bại" trên Frontend.
 * - QUAN TRỌNG: Không nên chỉ tin vào Return URL để cập nhật DB vì người dùng có thể can thiệp.
 *
 * 2. IPN (Instant Payment Notification):
 * - Đây là kênh Giao tiếp Server-to-Server. Đối tác (VNPay/MoMo) sẽ bí mật gọi vào API này để thông báo kết quả.
 * - Đây mới là nơi TIN CẬY NHẤT để cập nhật trạng thái đơn hàng (`PAID`, `PROCESSING`) trong Database.
 *
 * 3. CHECKSUM VALIDATION:
 * - Mọi dữ liệu đối tác gửi về đều phải được xác thực chữ ký (`vnp_SecureHash` hoặc `signature`) để đảm bảo không bị kẻ xấu giả mạo gói tin thanh toán.
 * =====================================================================
 */
@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  /**
   * =====================================================================
   * PAYMENT CONTROLLER - Cổng thanh toán
   * =====================================================================
   *
   * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
   *
   * 1. HASH & CHECKSUM (Bảo mật):
   * - Khi VNPay trả về kết quả (qua Return URL hoặc IPN), ta phải kiểm tra chữ ký (`vnp_SecureHash`).
   * - Nguyên tắc: Sort params a-z -> Stringify -> Hash với Secret Key -> So sánh với Hash nhận được.
   * - Nếu khớp -> Dữ liệu toàn vẹn (không bị hacker chỉnh sửa tiền/status).
   *
   * 2. IPN (Instant Payment Notification):
   * - Đây là kênh "Server-to-Server" để VNPay báo kết quả cho Backend.
   * - Độ tin cậy cao hơn Return URL (vì User có thể tắt browser trước khi redirect xong).
   * =====================================================================
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
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

        return res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:3000'}/en/order-success/${orderId}`,
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
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });
      if (!order) {
        return { RspCode: '01', Message: 'Order not found' };
      }

      // Check if already paid
      if (order.status !== 'PENDING') {
        return { RspCode: '02', Message: 'Order already confirmed' };
      }

      if (rspCode === '00') {
        // Payment Success -> Update Order Status
        await this.prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'PROCESSING', // Paid orders go to PROCESSING (or configured flow)
            paymentStatus: 'PAID',
          },
        });
        return { RspCode: '00', Message: 'Success' };
      } else {
        // Payment Failed
        await this.prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'CANCELLED',
            paymentStatus: 'FAILED',
          },
        });
        return { RspCode: '00', Message: 'Success' };
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
      return { message: 'MOMO_SECRET_KEY not configured' };
    }

    // MoMo IPN signature raw string format
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData || ''}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

    // Note: MoMo IPN signature validation might differ slightly by version/requestType.
    // This is the standard captureWallet version.
    const hmac = crypto.createHmac('sha256', secretKey);
    const expectedSignature = hmac.update(rawSignature).digest('hex');

    if (signature === expectedSignature) {
      // Find Order
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });
      if (!order) {
        return { message: 'Order not found' };
      }

      if (resultCode === 0) {
        // Success
        await this.prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'PROCESSING',
            paymentStatus: 'PAID',
            transactionId: transId.toString(),
          },
        });
      } else {
        // Failed
        await this.prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'CANCELLED',
            paymentStatus: 'FAILED',
          },
        });
      }
      return { message: 'Success' };
    } else {
      return { message: 'Signature mismatch' };
    }
  }
}
