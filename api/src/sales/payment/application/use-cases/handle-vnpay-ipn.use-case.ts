import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { ConfigService } from '@nestjs/config';
import { VNPayUtils } from '../../vnpay.utils';
import * as querystring from 'qs';
import { ConfirmPaymentUseCase } from './confirm-payment.use-case';

export interface HandleVNPayIPNInput {
  query: Record<string, any>;
}

export interface HandleVNPayIPNOutput {
  RspCode: string;
  Message: string;
}

@Injectable()
export class HandleVNPayIPNUseCase extends CommandUseCase<
  HandleVNPayIPNInput,
  HandleVNPayIPNOutput
> {
  constructor(
    private readonly configService: ConfigService,
    private readonly confirmPaymentUseCase: ConfirmPaymentUseCase,
  ) {
    super();
  }

  async execute(
    input: HandleVNPayIPNInput,
  ): Promise<Result<HandleVNPayIPNOutput>> {
    const vnp_Params = { ...input.query };
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    const sortedParams = VNPayUtils.sortObject(vnp_Params);
    const secretKey = this.configService.get('VNPAY_HASH_SECRET') || '';
    const signData = querystring.stringify(sortedParams, { encode: false });
    const isValid = VNPayUtils.verifySignature(secureHash, secretKey, signData);

    if (!isValid) {
      return Result.ok({ RspCode: '97', Message: 'Checksum failed' });
    }

    const orderId = vnp_Params['vnp_TxnRef'];
    const rspCode = vnp_Params['vnp_ResponseCode'];
    const amount = Number(vnp_Params['vnp_Amount']) / 100;
    const transactionId =
      vnp_Params['vnp_BankTranNo'] || vnp_Params['vnp_TransactionNo'];

    const status = rspCode === '00' ? 'SUCCESS' : 'FAILED';

    const result = await this.confirmPaymentUseCase.execute({
      orderId,
      gatewayTransactionId: transactionId,
      amount,
      status,
      metadata: vnp_Params,
    });

    if (result.isFailure) {
      return Result.ok({ RspCode: '01', Message: result.error.message });
    }

    return Result.ok({ RspCode: '00', Message: 'Success' });
  }
}
