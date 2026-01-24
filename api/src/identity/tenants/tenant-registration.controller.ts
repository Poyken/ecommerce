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
import { AuthService } from '@/identity/auth/auth.service';
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
 * =================================================================================================
 */
import {
  RegisterTenantUseCase,
  GetTenantUseCase,
} from '../application/use-cases/tenants';

@ApiTags('Tenant Registration (Public)')
@Controller('tenants')
export class TenantRegistrationController {
  constructor(
    private readonly registerUseCase: RegisterTenantUseCase,
    private readonly getTenantUseCase: GetTenantUseCase,
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
    const result = await this.registerUseCase.execute({
      name: dto.storeName,
      subdomain: dto.subdomain,
      email: dto.email,
      password: dto.password,
      plan: dto.plan,
      referralCode: dto.referralCode,
    });

    if (result.isFailure) {
      throw new HttpException(
        {
          message: result.error.message,
          code: (result.error as any).code || 'REGISTRATION_FAILED',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      message: 'Đăng ký thành công! Vui lòng hoàn thành thiết lập cửa hàng.',
      data: result.value,
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

    const result = await this.getTenantUseCase.execute({
      subdomain: subdomain.toLowerCase(),
    });

    return {
      available: result.isFailure, // Inverted logic: if failed to find, then it is available
      message: result.isSuccess
        ? 'Subdomain đã được sử dụng'
        : 'Subdomain có thể sử dụng',
      subdomain: subdomain.toLowerCase(),
    };
  }
}
