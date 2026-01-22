import { InjectQueue } from '@nestjs/bullmq';
import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { resolveMx } from 'dns/promises';
import { PrismaService } from '@core/prisma/prisma.service';
import { getTenant } from '@core/tenant/tenant.context';

/**
 * =====================================================================
 * NEWSLETTER SERVICE - Dịch vụ quản lý đăng ký bản tin
 * =====================================================================
 *
 * =====================================================================
 */

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);

  constructor(
    @InjectQueue('email-queue') private readonly emailQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  async subscribe(email: string) {
    this.logger.log(`New subscriber attempt: ${email}`);

    // Check MX Record
    try {
      const domain = email.split('@')[1];
      if (domain) {
        const mxRecords = await resolveMx(domain);
        if (!mxRecords || mxRecords.length === 0) {
          throw new Error('Invalid domain');
        }
      } else {
        throw new Error('Invalid email format');
      }
    } catch {
      throw new ConflictException(
        `Email domain '${email.split('@')[1]}' is invalid or unreachable`,
      );
    }

    const tenant = getTenant();
    if (!tenant) throw new ConflictException('Tenant invalid');
    const existing = await this.prisma.newsletterSubscriber.findFirst({
      where: {
        email,
        tenantId: tenant?.id,
      },
    });

    if (existing) {
      if (existing.isActive) {
        throw new ConflictException('Email already subscribed');
      } else {
        // Reactivate
        await this.prisma.newsletterSubscriber.update({
          where: { id: existing.id },
          data: { isActive: true },
        });
      }
    } else {
      // Create new
      await this.prisma.newsletterSubscriber.create({
        data: {
          email,
          tenantId: tenant?.id,
        },
      });
    }

    // Extract name from email for personalization
    const name = email.split('@')[0];

    // Add job to queue to send welcome email (mock)
    await this.emailQueue.add('send-email', {
      email,
      name,
      type: 'welcome-newsletter',
    });

    return { message: 'Subscribed successfully' };
  }

  async checkSubscriber(email: string) {
    const tenant = getTenant();
    if (!tenant) return { exists: false, isActive: false };
    const subscriber = await this.prisma.newsletterSubscriber.findFirst({
      where: {
        email,
        tenantId: tenant?.id,
      },
    });
    return {
      exists: !!subscriber,
      isActive: subscriber?.isActive ?? false,
    };
  }
}
