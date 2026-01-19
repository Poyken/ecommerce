import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { AuthService } from '@/auth/auth.service';
import { PrismaService } from '@core/prisma/prisma.service';

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * =================================================================================================
 * REGISTER TENANT DTO - DTO đăng ký tenant mới
 * =================================================================================================
 */
const RegisterTenantSchema = z.object({
  storeName: z
    .string()
    .min(1, 'Vui lòng nhập tên cửa hàng')
    .describe('Shop Thời Trang ABC'),
  subdomain: z.string().min(1, 'Vui lòng nhập subdomain').describe('shop-abc'),
  email: z.string().email('Email không hợp lệ').describe('owner@shop.com'),
  password: z
    .string()
    .min(6, 'Mật khẩu tối thiểu 6 ký tự')
    .describe('password123'),
  plan: z.enum(['basic', 'pro', 'enterprise']).optional().describe('basic'),
  referralCode: z.string().optional().describe('REF123'),
});
export class RegisterTenantDto extends createZodDto(RegisterTenantSchema) {}

/**
 * =================================================================================================
 * ONBOARDING DTO - DTO cập nhật onboarding
 * =================================================================================================
 */
const UpdateOnboardingSchema = z.object({
  logoUrl: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  businessType: z.string().optional(),
  themeConfig: z.record(z.string(), z.any()).optional(),
  onboardingStep: z.number().int().optional(),
  onboardingCompleted: z.boolean().optional(),
});
export class UpdateOnboardingDto extends createZodDto(UpdateOnboardingSchema) {}

/**
 * =================================================================================================
 * TENANT REGISTRATION CONTROLLER - QUẢN LÝ ĐĂNG KÝ CỬA HÀNG MỚI (CÔNG KHAI)
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PUBLIC ENDPOINTS:
 *    - Các API này KHÔNG yêu cầu authentication vì phục vụ quá trình đăng ký.
 *    - Client có thể gọi trực tiếp từ trang Marketing.
 *
 * 2. REGISTRATION FLOW:
 *    a. POST /register: Tạo tenant mới + user owner + gán gói BASIC
 *    b. GET /check-subdomain: Kiểm tra subdomain có sẵn không
 *    c. POST /:id/onboarding: Cập nhật thông tin onboarding
 *
 * 3. SECURITY:
 *    - Validate input chặt chẽ (email format, subdomain pattern)
 *    - Rate limiting nên được áp dụng ở tầng Infrastructure (NGINX/Cloudflare)
 *
 * =================================================================================================
 */
@ApiTags('Tenant Registration (Public)')
@Controller('tenants')
export class TenantRegistrationController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * POST /tenants/register
   * Đăng ký tenant mới với user owner
   */
  @Post('register')
  @ApiOperation({
    summary: 'Đăng ký cửa hàng mới',
    description:
      'Tạo tenant mới với subdomain, user owner và gói BASIC miễn phí',
  })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 409, description: 'Subdomain hoặc email đã tồn tại' })
  async register(@Body() dto: RegisterTenantDto) {
    // 1. Validate subdomain format (chỉ chữ thường, số và gạch ngang)
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/;
    if (!subdomainRegex.test(dto.subdomain)) {
      throw new HttpException(
        {
          message:
            'Subdomain không hợp lệ. Chỉ sử dụng chữ thường, số và gạch ngang.',
          code: 'INVALID_SUBDOMAIN',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // 2. Check reserved subdomains
    const reservedSubdomains = [
      'www',
      'api',
      'admin',
      'app',
      'mail',
      'ftp',
      'cdn',
      'assets',
      'static',
      'help',
      'support',
      'docs',
      'blog',
    ];
    if (reservedSubdomains.includes(dto.subdomain.toLowerCase())) {
      throw new HttpException(
        {
          message: 'Subdomain này đã được đặt trước',
          code: 'RESERVED_SUBDOMAIN',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // 3. Check if subdomain already exists
    const existingTenant = await this.prisma.tenant.findFirst({
      where: {
        OR: [{ subdomain: dto.subdomain }, { domain: dto.subdomain }],
      },
    });

    if (existingTenant) {
      throw new HttpException(
        {
          message: 'Subdomain đã được sử dụng',
          code: 'SUBDOMAIN_TAKEN',
        },
        HttpStatus.CONFLICT,
      );
    }

    // 4. Check if email already exists as a store owner
    const existingOwner = await this.prisma.user.findFirst({
      where: {
        email: dto.email.toLowerCase(),
        tenant: {
          ownerId: { not: null },
        },
      },
    });

    // Note: Email can exist in multiple tenants as customer, but not as owner
    // For simplicity, we just check if email exists at all
    // In production, you might want more sophisticated logic

    // 5. Create Tenant and Owner User in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Calculate trial end date (14 days from now)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      // Generate referral code for this tenant
      const referralCode = `REF${dto.subdomain.toUpperCase().slice(0, 4)}${Date.now().toString(36).toUpperCase()}`;

      // Create Tenant first (without owner)
      const tenant = await tx.tenant.create({
        data: {
          name: dto.storeName,
          subdomain: dto.subdomain.toLowerCase(),
          domain: dto.subdomain.toLowerCase(), // Can be updated to custom domain later
          plan: 'BASIC',
          isActive: true,
          onboardingCompleted: false,
          onboardingStep: 0,
          trialEndsAt,
          trialStartedAt: new Date(),
          referralCode,
          referredByCode: dto.referralCode || null,
          // Default limits for BASIC plan
          productLimit: 100,
          storageLimit: 1024,
          staffLimit: 2,
        },
      });

      // Hash password (you should import your actual password hashing utility)
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      // Create Owner User
      const owner = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          password: hashedPassword,
          tenantId: tenant.id,
        },
      });

      // Update tenant with owner
      const updatedTenant = await tx.tenant.update({
        where: { id: tenant.id },
        data: { ownerId: owner.id },
      });

      // Create default Admin role for owner
      const adminRole = await tx.role.create({
        data: {
          name: 'Admin',
          // description: 'Full access to store management',
          tenantId: tenant.id,
        },
      });

      // Assign Admin role to owner
      await tx.userRole.create({
        data: {
          userId: owner.id,
          roleId: adminRole.id,
        },
      });

      return {
        tenant: {
          id: updatedTenant.id,
          name: updatedTenant.name,
          subdomain: updatedTenant.subdomain,
          domain: updatedTenant.domain,
          plan: updatedTenant.plan,
          trialEndsAt: updatedTenant.trialEndsAt,
        },
        owner: {
          id: owner.id,
          email: owner.email,
        },
      };
    });

    return {
      message: 'Đăng ký thành công! Vui lòng hoàn thành thiết lập cửa hàng.',
      data: result,
    };
  }

  /**
   * GET /tenants/check-subdomain
   * Kiểm tra subdomain có sẵn không
   */
  @Get('check-subdomain')
  @ApiOperation({
    summary: 'Kiểm tra subdomain có sẵn không',
    description: 'Trả về true nếu subdomain có thể sử dụng',
  })
  @ApiQuery({ name: 'subdomain', required: true, example: 'shop-abc' })
  @ApiResponse({ status: 200, description: 'Kết quả kiểm tra' })
  async checkSubdomain(@Query('subdomain') subdomain: string) {
    if (!subdomain || subdomain.length < 3) {
      return {
        available: false,
        message: 'Subdomain phải có ít nhất 3 ký tự',
      };
    }

    // Validate format
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/;
    if (!subdomainRegex.test(subdomain.toLowerCase())) {
      return {
        available: false,
        message:
          'Subdomain không hợp lệ. Chỉ sử dụng chữ thường, số và gạch ngang.',
      };
    }

    // Check reserved
    const reservedSubdomains = [
      'www',
      'api',
      'admin',
      'app',
      'mail',
      'ftp',
      'cdn',
      'assets',
      'static',
      'help',
      'support',
      'docs',
      'blog',
    ];
    if (reservedSubdomains.includes(subdomain.toLowerCase())) {
      return {
        available: false,
        message: 'Subdomain này đã được đặt trước',
      };
    }

    // Check in database
    const existing = await this.prisma.tenant.findFirst({
      where: {
        OR: [
          { subdomain: subdomain.toLowerCase() },
          { domain: subdomain.toLowerCase() },
        ],
      },
    });

    return {
      available: !existing,
      message: existing
        ? 'Subdomain đã được sử dụng'
        : 'Subdomain có thể sử dụng',
      subdomain: subdomain.toLowerCase(),
    };
  }
}
