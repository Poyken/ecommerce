import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { ConfirmPaymentUseCase } from './confirm-payment.use-case';

export interface HandleMomoIPNInput {
  body: Record<string, any>;
}

export interface HandleMomoIPNOutput {
  message: string;
}

@Injectable()
export class HandleMomoIPNUseCase extends CommandUseCase<
  HandleMomoIPNInput,
  HandleMomoIPNOutput
> {
  constructor(
    private readonly configService: ConfigService,
    private readonly confirmPaymentUseCase: ConfirmPaymentUseCase,
  ) {
    super();
  }

  async execute(
    input: HandleMomoIPNInput,
  ): Promise<Result<HandleMomoIPNOutput>> {
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
    } = input.body;

    const secretKey = this.configService.get('MOMO_SECRET_KEY');
    const accessKey = this.configService.get('MOMO_ACCESS_KEY');

    if (!secretKey) throw new Error('MOMO_SECRET_KEY not configured');

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData || ''}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

    const hmac = crypto.createHmac('sha256', secretKey);
    const expectedSignature = hmac.update(rawSignature).digest('hex');

    if (signature !== expectedSignature) {
      return Result.ok({ message: 'Signature mismatch' });
    }

    const status = resultCode === 0 ? 'SUCCESS' : 'FAILED';

    const result = await this.confirmPaymentUseCase.execute({
      orderId,
      gatewayTransactionId: transId.toString(),
      amount: Number(amount),
      status,
      metadata: input.body,
    });

    if (result.isFailure) {
      return Result.ok({ message: result.error.message });
    }

    return Result.ok({ message: 'Success' });
  }
}
