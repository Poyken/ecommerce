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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HandleVNPayIPNUseCase,
  HandleMomoIPNUseCase,
} from './application/use-cases';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(
    private readonly handleVNPayIPNUseCase: HandleVNPayIPNUseCase,
    private readonly handleMomoIPNUseCase: HandleMomoIPNUseCase,
  ) {}

  @Get('vnpay_return')
  @ApiOperation({ summary: 'Handle VNPay Return URL' })
  async vnpayReturn(@Query() query: Record<string, any>, @Res() res) {
    const result = await this.handleVNPayIPNUseCase.execute({ query });
    const orderId = query['vnp_TxnRef'];
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (result.isSuccess && result.value.RspCode === '00') {
      return res.redirect(`${frontendUrl}/en/order-success/${orderId}`);
    }
    return res.redirect(`${frontendUrl}/en/order-failed/${orderId}`);
  }

  @Get('vnpay_ipn')
  @ApiOperation({ summary: 'Handle VNPay IPN (Server to Server)' })
  async vnpayIpn(@Query() query: Record<string, any>) {
    const result = await this.handleVNPayIPNUseCase.execute({ query });
    return result.getOrThrow();
  }

  @Post('momo_ipn')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle MoMo IPN (Server to Server)' })
  async momoIpn(@Body() body: Record<string, any>) {
    const result = await this.handleMomoIPNUseCase.execute({ body });
    return result.getOrThrow();
  }
}
