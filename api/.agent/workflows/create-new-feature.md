# Workflow: Tạo Tính năng Mới (Feature)

> **Reference Module:** `src/products`
> **Role:** Backend Developer
> **Standard:** NestJS Modular Monolith

## 1. Scaffolding (Khởi tạo)

Sử dụng Nest CLI để tạo cấu trúc chuẩn:

```bash
# 1. Tạo Module
nest g module modules/[feature-name]

# 2. Tạo Controller
nest g controller modules/[feature-name] --no-spec

# 3. Tạo Service
nest g service modules/[feature-name]
```

**Cấu trúc thư mục chuẩn:**

```text
src/modules/[feature-name]/
├── dto/
│   ├── create-[feature].dto.ts
│   ├── update-[feature].dto.ts
│   └── filter-[feature].dto.ts
├── [feature-name].controller.ts
├── [feature-name].module.ts
├── [feature-name].service.ts
└── [feature-name].service.spec.ts
```

## 2. Domain Logic & Types (Code Templates)

### A. DTO Template (`dto/create-[feature].dto.ts`)

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class Create[Feature]Dto {
  @ApiProperty({ example: 'Ten Feature' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Mo ta chi tiet', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'uuid-ref-id' })
  @IsUUID()
  @IsNotEmpty()
  referenceId: string;
}
```

### B. Service Template (`[feature].service.ts`)

```typescript
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { Create[Feature]Dto } from './dto/create-[feature].dto';

@Injectable()
export class [Feature]Service {
  private readonly logger = new Logger([Feature]Service.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: Create[Feature]Dto) {
    // 1. Validate references (Manual check usually needed for better error msg)
    // const ref = await this.prisma.ref.findUnique(...)

    // 2. Execute Transaction
    return this.prisma.[modelName].create({
      data: {
        ...dto,
      },
    });
  }

  async findAll(query: any) {
    // Implement pagination & filtering here
    return this.prisma.[modelName].findMany();
  }

  async findOne(id: string) {
    const item = await this.prisma.[modelName].findUnique({ where: { id } });
    if (!item) throw new NotFoundException('[Feature] not found');
    return item;
  }
}
```

### C. Controller Template (`[feature].controller.ts`)

```typescript
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { [Feature]Service } from './[feature].service';
import { Create[Feature]Dto } from './dto/create-[feature].dto';

@ApiTags('[Features]')
@Controller('[features]')
export class [Feature]Controller {
  constructor(private readonly service: [Feature]Service) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('[feature]:create') // Defined in Permission Enum
  @ApiOperation({ summary: 'Create new [feature] (Admin)' })
  create(@Body() dto: Create[Feature]Dto) {
    return this.service.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get [feature] details' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
```

## 3. UI/API Integration (Wiring)

1.  **Register Module:**
    Nest CLI tự động thêm vào `app.module.ts`. Kiểm tra lại:

    ```typescript
    @Module({
      imports: [..., [Feature]Module],
    })
    export class AppModule {}
    ```

2.  **Define Permissions:**
    Thêm quyền mới vào seed hoặc Enum permissions (nếu có logic check cứng).

3.  **Env Variables:**
    Nếu feature cần key mới (vd: API 3rd party), thêm vào `.env` và `constants.ts`.

## 4. Verification

1.  **Unit Test:**
    Chạy test generated bởi CLI:

    ```bash
    npm test src/modules/[feature-name]
    ```

2.  **Manual Test (Swagger):**
    - `npm run start:dev`
    - Mở `http://localhost:8080/docs`
    - Tìm tag `[Features]`
    - Test `POST` (Login lấy Token Admin trước) -> `201 Created`.
    - Test `GET` -> `200 OK`.
