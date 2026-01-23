import { Test, TestingModule } from '@nestjs/testing';
import {
  CreateProductUseCase,
  CreateProductInput,
} from './create-product.use-case';
import { PRODUCT_REPOSITORY } from '../../../domain/repositories/product.repository.interface';
import { CATEGORY_REPOSITORY } from '../../../domain/repositories/category.repository.interface';
import { BRAND_REPOSITORY } from '../../../domain/repositories/brand.repository.interface';
import { Product } from '../../../domain/entities/product.entity';
import {
  EntityNotFoundError,
  BusinessRuleViolationError,
} from '@/core/domain/errors/domain.error';
import { Result } from '@/core/application/result';

describe('CreateProductUseCase', () => {
  let useCase: CreateProductUseCase;
  let productRepo: any;
  let categoryRepo: any;
  let brandRepo: any;

  beforeEach(async () => {
    productRepo = {
      isSlugUnique: jest.fn(),
      save: jest.fn(),
    };
    categoryRepo = {
      findByIds: jest.fn(),
    };
    brandRepo = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateProductUseCase,
        { provide: PRODUCT_REPOSITORY, useValue: productRepo },
        { provide: CATEGORY_REPOSITORY, useValue: categoryRepo },
        { provide: BRAND_REPOSITORY, useValue: brandRepo },
      ],
    }).compile();

    useCase = module.get<CreateProductUseCase>(CreateProductUseCase);
  });

  it('should create a product successfully', async () => {
    // Arrange
    const input: CreateProductInput = {
      tenantId: 'tenant-1',
      name: 'Test Product',
      brandId: 'brand-1',
      categoryIds: ['cat-1'],
      options: [],
      images: [],
    };

    categoryRepo.findByIds.mockResolvedValue([{ id: 'cat-1' }]);
    brandRepo.findById.mockResolvedValue({ id: 'brand-1' });
    productRepo.isSlugUnique.mockResolvedValue(true);
    productRepo.save.mockImplementation((p: Product) => Promise.resolve(p));

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.isSuccess).toBe(true);
    expect((result as any).value.product).toBeDefined();
    expect((result as any).value.product.name).toBe('Test Product');
    expect((result as any).value.product.slug.value).toBe('test-product');
    expect(productRepo.save).toHaveBeenCalled();
  });

  it('should fail if category does not exist', async () => {
    // Arrange
    const input: CreateProductInput = {
      tenantId: 'tenant-1',
      name: 'Test Product',
      brandId: 'brand-1',
      categoryIds: ['cat-1'],
    };

    categoryRepo.findByIds.mockResolvedValue([]); // No categories found

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.isFailure).toBe(true);
    expect((result as any).error).toBeInstanceOf(EntityNotFoundError);
  });

  it('should fail if brand does not exist', async () => {
    // Arrange
    const input: CreateProductInput = {
      tenantId: 'tenant-1',
      name: 'Test Product',
      brandId: 'brand-1', // Invalid
      categoryIds: ['cat-1'],
    };

    categoryRepo.findByIds.mockResolvedValue([{ id: 'cat-1' }]);
    brandRepo.findById.mockResolvedValue(null);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.isFailure).toBe(true);
    expect((result as any).error).toBeInstanceOf(EntityNotFoundError);
  });

  it('should fail if slug is duplicate', async () => {
    // Arrange
    const input: CreateProductInput = {
      tenantId: 'tenant-1',
      name: 'Test Product',
      brandId: 'brand-1',
      categoryIds: ['cat-1'],
    };

    categoryRepo.findByIds.mockResolvedValue([{ id: 'cat-1' }]);
    brandRepo.findById.mockResolvedValue({ id: 'brand-1' });
    productRepo.isSlugUnique.mockResolvedValue(false); // Duplicate

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.isFailure).toBe(true);
    expect((result as any).error).toBeInstanceOf(BusinessRuleViolationError);
  });
});
