import { Injectable } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { IPaymentRepository } from '../../domain/repositories/payment.repository.interface';
import {
  Payment,
  PaymentProps,
  PaymentStatus,
} from '../../domain/entities/payment.entity';

@Injectable()
export class PrismaPaymentRepository implements IPaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(payment: Payment): Promise<Payment> {
    const data = payment.toPersistence() as any;

    const saved = await (this.prisma.payment as any).upsert({
      where: { id: payment.id },
      update: {
        status: data.status,
        providerTransactionId: data.providerTransactionId,
        metadata: data.metadata || {},
        paidAt: data.paidAt,
        updatedAt: new Date(),
      },
      create: {
        id: data.id,
        orderId: data.orderId,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        paymentMethod: data.paymentMethod,
        providerTransactionId: data.providerTransactionId,
        metadata: data.metadata || {},
        paidAt: data.paidAt,
        tenantId: data.tenantId,
      },
    });

    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Payment | null> {
    const p = await (this.prisma.payment as any).findUnique({ where: { id } });
    return p ? this.toDomain(p) : null;
  }

  async findByOrderId(orderId: string): Promise<Payment[]> {
    const payments = await (this.prisma.payment as any).findMany({
      where: { orderId },
    });
    return payments.map((p) => this.toDomain(p));
  }

  async findByProviderTransactionId(id: string): Promise<Payment | null> {
    const p = await (this.prisma.payment as any).findFirst({
      where: { providerTransactionId: id },
    });
    return p ? this.toDomain(p) : null;
  }

  private toDomain(p: any): Payment {
    return Payment.fromPersistence({
      id: p.id,
      orderId: p.orderId,
      amount: Number(p.amount),
      currency: p.currency,
      status: p.status as PaymentStatus,
      paymentMethod: p.paymentMethod,
      providerTransactionId: p.providerTransactionId,
      metadata: p.metadata,
      paidAt: p.paidAt,
      tenantId: p.tenantId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    });
  }
}
