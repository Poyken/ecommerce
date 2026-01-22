# Chiến lược Di chuyển Dữ liệu & Seeding
## Nền tảng E-commerce Multi-tenant

---

### Thông tin tài liệu

**Phiên bản**: 1.0  
**Ngày**: 22 tháng 1, 2026  
**Tác giả**: Đội ngũ Database  
**Trạng thái**: Bản nháp  

---

### Tổng quan về Di chuyển Dữ liệu

#### Triết lý Migration

1. **Zero Downtime**: Không ảnh hưởng đến hoạt động kinh doanh
2. **Data Integrity**: Đảm bảo tính toàn vẹn dữ liệu
3. **Rollback Capability**: Có khả năng rollback khi cần
4. **Multi-Tenant Safe**: An toàn cho tất cả tenants
5. **Performance Optimized**: Tối ưu hiệu suất trong quá trình migration

#### Phân loại Migration

**1. Schema Migration**
- Thay đổi cấu trúc database
- Thêm/cột bảng, cột, index
- Modify constraints, triggers

**2. Data Migration**
- Di chuyển dữ liệu từ hệ thống cũ
- Transform và cleanse data
- Populate initial data

**3. Seeding Data**
- Master data setup
- Test data generation
- Demo data creation

---

### Chiến lược Schema Migration

#### Migration Framework

**1. Prisma Migration Setup**
```typescript
// prisma/migrations/migration-utils.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

export class MigrationManager {
  private static instance: MigrationManager;
  
  static getInstance(): MigrationManager {
    if (!MigrationManager.instance) {
      MigrationManager.instance = new MigrationManager();
    }
    return MigrationManager.instance;
  }

  async runMigration(migrationName: string): Promise<void> {
    try {
      logger.info(`Starting migration: ${migrationName}`);
      
      // Backup before migration
      await this.createBackup(migrationName);
      
      // Run Prisma migration
      execSync(`npx prisma migrate deploy --name ${migrationName}`, {
        stdio: 'inherit'
      });
      
      // Verify migration
      await this.verifyMigration(migrationName);
      
      logger.info(`Migration completed: ${migrationName}`);
    } catch (error) {
      logger.error(`Migration failed: ${migrationName}`, error);
      await this.rollbackMigration(migrationName);
      throw error;
    }
  }

  async createBackup(migrationName: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup_${migrationName}_${timestamp}`;
    
    try {
      // Create database backup
      execSync(`pg_dump -h localhost -U postgres -d ecommerce > backups/${backupName}.sql`);
      
      // Store backup metadata
      await prisma.backupMetadata.create({
        data: {
          name: backupName,
          migrationName,
          createdAt: new Date(),
          status: 'completed'
        }
      });
      
      logger.info(`Backup created: ${backupName}`);
    } catch (error) {
      logger.error('Backup creation failed', error);
      throw error;
    }
  }

  async rollbackMigration(migrationName: string): Promise<void> {
    try {
      logger.info(`Rolling back migration: ${migrationName}`);
      
      // Find latest backup
      const backup = await prisma.backupMetadata.findFirst({
        where: { migrationName },
        orderBy: { createdAt: 'desc' }
      });
      
      if (!backup) {
        throw new Error(`No backup found for migration: ${migrationName}`);
      }
      
      // Restore from backup
      execSync(`psql -h localhost -U postgres -d ecommerce < backups/${backup.name}.sql`);
      
      // Update backup status
      await prisma.backupMetadata.update({
        where: { id: backup.id },
        data: { status: 'rolled_back' }
      });
      
      logger.info(`Rollback completed: ${migrationName}`);
    } catch (error) {
      logger.error(`Rollback failed: ${migrationName}`, error);
      throw error;
    }
  }

  async verifyMigration(migrationName: string): Promise<void> {
    try {
      // Run verification scripts
      const verificationScript = `prisma/migrations/verify-${migrationName}.sql`;
      
      if (require('fs').existsSync(verificationScript)) {
        execSync(`psql -h localhost -U postgres -d ecommerce < ${verificationScript}`);
      }
      
      // Check data integrity
      await this.checkDataIntegrity();
      
      logger.info(`Migration verified: ${migrationName}`);
    } catch (error) {
      logger.error(`Migration verification failed: ${migrationName}`, error);
      throw error;
    }
  }

  private async checkDataIntegrity(): Promise<void> {
    // Check foreign key constraints
    const fkCheck = await prisma.$queryRaw`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
    `;
    
    // Check data consistency
    const tenantCheck = await prisma.$queryRaw`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE column_name = 'tenantId'
      AND table_schema = 'public'
      AND table_name NOT IN ('tenants', 'migrations', '_prisma_migrations')
    `;
    
    logger.info('Data integrity check passed');
  }
}
```

**2. Migration Scripts**
```sql
-- prisma/migrations/001_add_tenant_isolation.sql
-- Enable Row Level Security for all tenant-specific tables

DO $$
DECLARE
    table_name text;
BEGIN
    -- Add tenantId to existing tables if not exists
    FOR table_name IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN ('tenants', 'users', 'migrations', '_prisma_migrations')
    LOOP
        -- Add tenantId column if not exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = table_name 
            AND column_name = 'tenantId'
        ) THEN
            EXECUTE format('ALTER TABLE %I ADD COLUMN tenantId UUID REFERENCES tenants(id)', table_name);
            
            -- Set default tenant for existing data
            EXECUTE format('UPDATE %I SET tenantId = (SELECT id FROM tenants LIMIT 1) WHERE tenantId IS NULL', table_name);
            
            -- Add NOT NULL constraint
            EXECUTE format('ALTER TABLE %I ALTER COLUMN tenantId SET NOT NULL', table_name);
        END IF;
        
        -- Enable RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
        
        -- Create tenant isolation policy
        EXECUTE format('
            CREATE POLICY tenant_isolation_policy ON %I
            FOR ALL
            USING (tenantId = current_setting(''app.current_tenant_id'')::UUID)
            WITH CHECK (tenantId = current_setting(''app.current_tenant_id'')::UUID)
        ', table_name);
    END LOOP;
END $$;

-- Add indexes for performance
CREATE INDEX CONCURRENTLY idx_products_tenant_id ON products(tenantId);
CREATE INDEX CONCURRENTLY idx_orders_tenant_id ON orders(tenantId);
CREATE INDEX CONCURRENTLY idx_customers_tenant_id ON customers(tenantId);
```

---

### Chiến lược Data Migration

#### Data Mapping & Transformation

**1. Data Mapping Configuration**
```typescript
// src/migration/data-mapper.ts
export interface DataMapping {
  sourceTable: string;
  targetTable: string;
  fieldMappings: FieldMapping[];
  transformationRules?: TransformationRule[];
  validationRules?: ValidationRule[];
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'uuid';
  required: boolean;
  defaultValue?: any;
}

export interface TransformationRule {
  sourceField: string;
  transformation: 'uppercase' | 'lowercase' | 'trim' | 'format-date' | 'calculate';
  parameters?: any;
}

export interface ValidationRule {
  field: string;
  rule: 'required' | 'email' | 'phone' | 'positive' | 'future-date';
  errorMessage: string;
}

// Example mapping configuration
const customerMapping: DataMapping = {
  sourceTable: 'legacy_customers',
  targetTable: 'customers',
  fieldMappings: [
    { sourceField: 'cust_id', targetField: 'id', dataType: 'uuid', required: true },
    { sourceField: 'tenant_id', targetField: 'tenantId', dataType: 'uuid', required: true },
    { sourceField: 'first_name', targetField: 'firstName', dataType: 'string', required: true },
    { sourceField: 'last_name', targetField: 'lastName', dataType: 'string', required: true },
    { sourceField: 'email', targetField: 'email', dataType: 'string', required: true },
    { sourceField: 'phone', targetField: 'phone', dataType: 'string', required: false },
  ],
  transformationRules: [
    { sourceField: 'email', transformation: 'lowercase' },
    { sourceField: 'first_name', transformation: 'trim' },
    { sourceField: 'last_name', transformation: 'trim' },
  ],
  validationRules: [
    { field: 'email', rule: 'email', errorMessage: 'Invalid email format' },
    { field: 'phone', rule: 'phone', errorMessage: 'Invalid phone format' },
  ]
};
```

**2. Data Transformation Engine**
```typescript
// src/migration/transformer.ts
export class DataTransformer {
  async transformData(
    sourceData: any[], 
    mapping: DataMapping
  ): Promise<any[]> {
    const transformedData: any[] = [];
    
    for (const record of sourceData) {
      try {
        const transformed = await this.transformRecord(record, mapping);
        const validation = await this.validateRecord(transformed, mapping);
        
        if (validation.isValid) {
          transformedData.push(transformed);
        } else {
          logger.warn(`Record validation failed: ${validation.errors.join(', ')}`);
          // Handle invalid records (log, quarantine, etc.)
        }
      } catch (error) {
        logger.error(`Record transformation failed:`, error);
        // Handle transformation errors
      }
    }
    
    return transformedData;
  }

  private async transformRecord(record: any, mapping: DataMapping): Promise<any> {
    const transformed: any = {};
    
    // Map fields
    for (const fieldMapping of mapping.fieldMappings) {
      let value = record[fieldMapping.sourceField];
      
      // Apply transformations
      if (mapping.transformationRules) {
        for (const rule of mapping.transformationRules) {
          if (rule.sourceField === fieldMapping.sourceField) {
            value = await this.applyTransformation(value, rule);
          }
        }
      }
      
      // Convert data type
      value = this.convertDataType(value, fieldMapping.dataType);
      
      // Handle required fields and defaults
      if (value === null || value === undefined) {
        if (fieldMapping.required) {
          throw new Error(`Required field ${fieldMapping.targetField} is missing`);
        }
        value = fieldMapping.defaultValue;
      }
      
      transformed[fieldMapping.targetField] = value;
    }
    
    return transformed;
  }

  private async applyTransformation(value: any, rule: TransformationRule): Promise<any> {
    switch (rule.transformation) {
      case 'uppercase':
        return typeof value === 'string' ? value.toUpperCase() : value;
      
      case 'lowercase':
        return typeof value === 'string' ? value.toLowerCase() : value;
      
      case 'trim':
        return typeof value === 'string' ? value.trim() : value;
      
      case 'format-date':
        return this.formatDate(value, rule.parameters);
      
      case 'calculate':
        return this.calculateValue(value, rule.parameters);
      
      default:
        return value;
    }
  }

  private convertDataType(value: any, targetType: string): any {
    switch (targetType) {
      case 'string':
        return value !== null ? String(value) : null;
      
      case 'number':
        return value !== null ? Number(value) : null;
      
      case 'date':
        return value !== null ? new Date(value) : null;
      
      case 'boolean':
        return value !== null ? Boolean(value) : null;
      
      case 'uuid':
        return typeof value === 'string' ? value : null;
      
      default:
        return value;
    }
  }

  private async validateRecord(record: any, mapping: DataMapping): Promise<ValidationResult> {
    const errors: string[] = [];
    
    if (mapping.validationRules) {
      for (const rule of mapping.validationRules) {
        const value = record[rule.field];
        const isValid = await this.validateField(value, rule);
        
        if (!isValid) {
          errors.push(`${rule.field}: ${rule.errorMessage}`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private async validateField(value: any, rule: ValidationRule): Promise<boolean> {
    switch (rule.rule) {
      case 'required':
        return value !== null && value !== undefined && value !== '';
      
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      
      case 'phone':
        return /^\+?[\d\s\-\(\)]+$/.test(value);
      
      case 'positive':
        return Number(value) > 0;
      
      case 'future-date':
        return new Date(value) > new Date();
      
      default:
        return true;
    }
  }

  private formatDate(value: any, format: string): string {
    const date = new Date(value);
    // Implement date formatting based on format string
    return date.toISOString();
  }

  private calculateValue(value: any, calculation: any): any {
    // Implement calculation logic
    return value;
  }
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
```

---

### Chiến lược Seeding Data

#### Master Data Seeding

**1. Categories Seeding**
```typescript
// prisma/seed/categories.ts
export const categories = [
  {
    id: 'cat-electronics',
    name: 'Electronics',
    description: 'Electronic devices and accessories',
    slug: 'electronics',
    parentId: null,
    isActive: true,
    sortOrder: 1,
    metadata: {
      icon: 'electronics',
      featured: true
    }
  },
  {
    id: 'cat-clothing',
    name: 'Clothing',
    description: 'Fashion and apparel',
    slug: 'clothing',
    parentId: null,
    isActive: true,
    sortOrder: 2,
    metadata: {
      icon: 'clothing',
      featured: true
    }
  }
];

export async function seedCategories(prisma: PrismaClient, tenantId: string): Promise<void> {
  logger.info(`Seeding categories for tenant: ${tenantId}`);
  
  for (const category of categories) {
    await prisma.category.upsert({
      where: {
        tenantId_slug: {
          tenantId,
          slug: category.slug
        }
      },
      update: {
        name: category.name,
        description: category.description,
        isActive: category.isActive,
        sortOrder: category.sortOrder,
        metadata: category.metadata
      },
      create: {
        ...category,
        tenantId
      }
    });
  }
  
  logger.info(`Categories seeded for tenant: ${tenantId}`);
}
```

**2. Products Seeding**
```typescript
// prisma/seed/products.ts
export const products = [
  {
    id: 'prod-laptop-pro',
    name: 'Laptop Pro 15"',
    description: 'High-performance laptop for professionals',
    slug: 'laptop-pro-15',
    sku: 'LP-PRO-15',
    price: 1299.99,
    compareAtPrice: 1599.99,
    costPrice: 899.99,
    trackInventory: true,
    inventoryQuantity: 100,
    weight: 2.5,
    status: 'active',
    metadata: {
      brand: 'TechBrand',
      model: 'Pro-15',
      specifications: {
        cpu: 'Intel i7-12th Gen',
        ram: '16GB DDR4',
        storage: '512GB SSD',
        display: '15.6" 4K'
      }
    }
  }
];

export async function seedProducts(prisma: PrismaClient, tenantId: string): Promise<void> {
  logger.info(`Seeding products for tenant: ${tenantId}`);
  
  // Get category IDs
  const electronicsCategory = await prisma.category.findFirst({
    where: { tenantId, slug: 'electronics' }
  });
  
  for (const product of products) {
    await prisma.product.upsert({
      where: {
        tenantId_sku: {
          tenantId,
          sku: product.sku
        }
      },
      update: {
        name: product.name,
        description: product.description,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        costPrice: product.costPrice,
        inventoryQuantity: product.inventoryQuantity,
        status: product.status,
        metadata: product.metadata
      },
      create: {
        ...product,
        tenantId,
        categoryId: electronicsCategory?.id
      }
    });
  }
  
  logger.info(`Products seeded for tenant: ${tenantId}`);
}
```

---

### Migration Monitoring & Logging

**1. Migration Tracking**
```typescript
// src/migration/migration-tracker.ts
export class MigrationTracker {
  constructor(private prisma: PrismaClient) {}

  async startMigration(migrationName: string, description: string): Promise<string> {
    const migration = await this.prisma.migration.create({
      data: {
        name: migrationName,
        description,
        status: 'running',
        startedAt: new Date()
      }
    });
    
    logger.info(`Migration started: ${migrationName} (ID: ${migration.id})`);
    return migration.id;
  }

  async updateProgress(
    migrationId: string, 
    progress: number, 
    message?: string
  ): Promise<void> {
    await this.prisma.migration.update({
      where: { id: migrationId },
      data: {
        progress,
        message,
        updatedAt: new Date()
      }
    });
    
    logger.info(`Migration progress: ${migrationId} - ${progress}% - ${message || ''}`);
  }

  async completeMigration(
    migrationId: string, 
    result: MigrationResult
  ): Promise<void> {
    await this.prisma.migration.update({
      where: { id: migrationId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        progress: 100,
        result: {
          totalRecords: result.totalRecords,
          successCount: result.successCount,
          errorCount: result.errorCount,
          duration: result.duration,
          throughput: result.throughput
        }
      }
    });
    
    logger.info(`Migration completed: ${migrationId}`);
  }

  async failMigration(
    migrationId: string, 
    error: Error
  ): Promise<void> {
    await this.prisma.migration.update({
      where: { id: migrationId },
      data: {
        status: 'failed',
        completedAt: new Date(),
        error: error.message
      }
    });
    
    logger.error(`Migration failed: ${migrationId}`, error);
  }
}

interface MigrationResult {
  success: boolean;
  totalRecords: number;
  successCount: number;
  errorCount: number;
  duration: number;
  errors: any[];
  throughput: number;
}
```

---

### Approval

**Database Lead**: ___________________  
**Ngày**: ___________________  
**Chữ ký**: ___________________

**DevOps Lead**: ___________________  
**Ngày**: ___________________  
**Chữ ký**: ___________________

**Tech Lead**: ___________________  
**Ngày**: ___________________  
**Chữ ký**: ___________________
