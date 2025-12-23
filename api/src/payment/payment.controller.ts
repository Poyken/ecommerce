import { Controller, Get, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import * as crypto from 'crypto';
import * as querystring from 'qs';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('vnpay_return')
  @ApiOperation({ summary: 'Handle VNPay Return URL' })
  async vnpayReturn(@Query() query: any, @Res() res) {
    const vnp_Params = { ...query };
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // Sort params
    const sortedParams = this.sortObject(vnp_Params);

    const secretKey = this.configService.get('VNPAY_HASH_SECRET');
    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash === signed) {
      // Check transaction status
      if (vnp_Params['vnp_ResponseCode'] === '00') {
        // Success
        // Redirect to frontend success page
        const orderId = vnp_Params['vnp_TxnRef'];
        return res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:3000'}/order-success/${orderId}`,
        );
      } else {
        // Failed
        return res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:3000'}/order-failed`,
        );
      }
    } else {
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/order-failed?reason=checksum_failed`,
      );
    }
  }

  @Get('vnpay_ipn')
  @ApiOperation({ summary: 'Handle VNPay IPN (Server to Server)' })
  async vnpayIpn(@Query() query: any) {
    const vnp_Params = { ...query };
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    const sortedParams = this.sortObject(vnp_Params);
    const secretKey = this.configService.get('VNPAY_HASH_SECRET');
    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash === signed) {
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

  private sortObject(obj: any): any {
    const sorted: Record<string, string> = {};
    const str: string[] = [];
    let key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
    }
    return sorted;
  }
}
