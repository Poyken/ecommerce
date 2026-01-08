import { Test, TestingModule } from '@nestjs/testing';
import { BlogService } from './blog.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { ConflictException } from '@nestjs/common';

describe('BlogService', () => {
  let service: BlogService;

  const mockPrismaService = {
    blog: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    blogProduct: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlogService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BlogService>(BlogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create blog with default draft status', async () => {
      mockPrismaService.blog.create.mockResolvedValue({
        id: 'b1',
        title: 'Test Blog',
        publishedAt: null,
      });

      const result = await service.create({
        title: 'Test Blog',
        slug: 'test-blog',
        excerpt: 'Excerpt',
        content: 'Content',
        category: 'Tech',
        author: 'Admin',
      });

      expect(result.publishedAt).toBeNull();
    });

    it('should throw ConflictException for duplicate slug', async () => {
      mockPrismaService.blog.create.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.create({
          title: 'Test',
          slug: 'existing-slug',
          excerpt: 'E',
          content: 'C',
          category: 'Cat',
          author: 'A',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return published blogs by default', async () => {
      mockPrismaService.blog.findMany.mockResolvedValue([
        { id: 'b1', publishedAt: new Date(), products: [] },
      ]);
      mockPrismaService.blog.count.mockResolvedValue(1);

      const result = await service.findAll({ status: 'published' });

      expect(result.data).toHaveLength(1);
    });

    it('should filter drafts', async () => {
      mockPrismaService.blog.findMany.mockResolvedValue([]);
      mockPrismaService.blog.count.mockResolvedValue(0);

      await service.findAll({ status: 'draft' });

      expect(mockPrismaService.blog.findMany).toHaveBeenCalled();
    });
  });

  describe('togglePublish', () => {
    it('should publish a draft blog', async () => {
      mockPrismaService.blog.findUnique.mockResolvedValue({
        id: 'b1',
        publishedAt: null,
      });
      mockPrismaService.blog.update.mockResolvedValue({
        id: 'b1',
        publishedAt: expect.any(Date),
      });

      const result = await service.togglePublish('b1');
      expect(result.publishedAt).toBeDefined();
    });

    it('should unpublish a published blog', async () => {
      mockPrismaService.blog.findUnique.mockResolvedValue({
        id: 'b1',
        publishedAt: new Date(),
      });
      mockPrismaService.blog.update.mockResolvedValue({
        id: 'b1',
        publishedAt: null,
      });

      const result = await service.togglePublish('b1');
      expect(result.publishedAt).toBeNull();
    });
  });

  describe('remove', () => {
    it('should soft delete blog', async () => {
      mockPrismaService.blog.findUnique.mockResolvedValue({
        id: 'b1',
        slug: 'test',
        userId: 'u1',
      });
      mockPrismaService.blog.update.mockResolvedValue({
        id: 'b1',
        deletedAt: new Date(),
      });

      const result = await service.remove('b1');
      expect(result.deletedAt).toBeDefined();
    });

    it('should throw if not owner and no permission', async () => {
      mockPrismaService.blog.findUnique.mockResolvedValue({
        id: 'b1',
        userId: 'other',
      });

      await expect(
        service.remove('b1', { id: 'u1', permissions: [] }),
      ).rejects.toThrow('Forbidden resource');
    });
  });
});
