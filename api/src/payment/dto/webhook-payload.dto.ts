import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class WebhookPayloadDto {
  @ApiProperty({
    example: 'VQ-12345678',
    description: 'Transaction ID from bank',
  })
  @IsString()
  @IsOptional()
  gatewayTransactionId?: string;

  @ApiProperty({
    example: 'THANHTOAN clr...',
    description: 'Transaction content/description',
  })
  @IsString()
  content: string; // The content usually contains the Order ID

  @ApiProperty({ example: 500000, description: 'Amount transferred' })
  @IsNumber()
  amount: number;

  @ApiProperty({
    example: '2023-10-27T10:00:00Z',
    description: 'Transaction date',
  })
  @IsString()
  @IsOptional()
  transactionDate?: string;

  @ApiProperty({ example: '123456', description: 'Account number of sender' })
  @IsString()
  @IsOptional()
  accountNumber?: string;
}
