# NestJS Component Template

> Copy và sửa đổi template này khi tạo Feature mới bằng tay (nếu không dùng CLI).

## 1. Controller (`[name].controller.ts`)

```typescript
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { [Name]Service } from './[name].service';
import { Create[Name]Dto } from './dto/create-[name].dto';
import { Update[Name]Dto } from './dto/update-[name].dto';
import { Filter[Name]Dto } from './dto/filter-[name].dto';

@ApiTags('[Names]')
@Controller('[names]')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class [Name]Controller {
  constructor(private readonly [name]Service: [Name]Service) {}

  @Post()
  @Permissions('[name]:create')
  @ApiOperation({ summary: 'Create [name]' })
  create(@Body() create[Name]Dto: Create[Name]Dto) {
    return this.[name]Service.create(create[Name]Dto);
  }

  @Get()
  @Permissions('[name]:read')
  @ApiOperation({ summary: 'List [names]' })
  findAll(@Query() filter: Filter[Name]Dto) {
    return this.[name]Service.findAll(filter);
  }

  @Get(':id')
  @Permissions('[name]:read')
  @ApiOperation({ summary: 'Get one [name]' })
  findOne(@Param('id') id: string) {
    return this.[name]Service.findOne(id);
  }

  @Patch(':id')
  @Permissions('[name]:update')
  @ApiOperation({ summary: 'Update [name]' })
  update(@Param('id') id: string, @Body() update[Name]Dto: Update[Name]Dto) {
    return this.[name]Service.update(id, update[Name]Dto);
  }

  @Delete(':id')
  @Permissions('[name]:delete')
  @ApiOperation({ summary: 'Delete [name]' })
  remove(@Param('id') id: string) {
    return this.[name]Service.remove(id);
  }
}
```

## 2. Service (`[name].service.ts`)

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { Create[Name]Dto } from './dto/create-[name].dto';
import { Update[Name]Dto } from './dto/update-[name].dto';
import { Filter[Name]Dto } from './dto/filter-[name].dto';

@Injectable()
export class [Name]Service {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: Create[Name]Dto) {
    return this.prisma.[modelName].create({
      data: dto,
    });
  }

  async findAll(filter: Filter[Name]Dto) {
    // Implement filtering logic
    return this.prisma.[modelName].findMany();
  }

  async findOne(id: string) {
    const item = await this.prisma.[modelName].findUnique({ where: { id } });
    if (!item) throw new NotFoundException('[Name] not found');
    return item;
  }

  async update(id: string, dto: Update[Name]Dto) {
    await this.findOne(id); // Ensure exists
    return this.prisma.[modelName].update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Ensure exists
    return this.prisma.[modelName].delete({ where: { id } });
  }
}
```
