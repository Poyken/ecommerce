import { PrismaService } from '@core/prisma/prisma.service';
import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { Blog } from '@prisma/client';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

/**
 * =====================================================================
 * BLOG SERVICE - QUẢN LÝ NỘI DUNG VÀ TIN TỨC
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CONTENT COMMERCE (Bán hàng qua nội dung):
 * - Hệ thống cho phép gắn các sản phẩm (`Product`) vào bài viết Blog.
 * - Điều này giúp khách hàng có thể mua hàng ngay khi đang đọc bài review hoặc hướng dẫn.
 *
 * 2. PUBLISH WORKFLOW:
 * - Mặc định mọi bài viết khi tạo mới đều là `Draft` (Nháp - `publishedAt = null`).
 * - Chỉ khi Admin phê duyệt và bấm Publish thì bài viết mới hiển thị ra ngoài web.
 *
 * 3. SEO-FRIENDLY SLUG:
 * - Hệ thống sử dụng `slug` thay vì `id` trên URL (VD: `/blog/huong-dan-chon-giay`) để tối ưu SEO. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

 * =====================================================================
 */

@Injectable()
export class BlogService {
  private readonly logger = new Logger(BlogService.name);

  constructor(private prisma: PrismaService) {}

  async create(createBlogDto: CreateBlogDto, userId?: string): Promise<Blog> {
    const { productIds, ...blogData } = createBlogDto;

    const data: any = { ...blogData };

    if (userId) {
      data.userId = userId; // Ensure userId is set in the data object
      if (!data.author) {
        const user = await (this.prisma.user as any).findUnique({
          where: { id: userId },
        });
        if (user) {
          data.author = `${user.firstName} ${user.lastName}`;
        }
      }
    }

    try {
      return await (this.prisma.blog as any).create({
        data: {
          ...data,
          publishedAt: null, // Default to Draft. Admin must publish.
          // Connect products if provided
          ...(productIds && productIds.length > 0
            ? {
                products: {
                  create: productIds.map((productId) => ({
                    product: { connect: { id: productId } },
                  })),
                },
              }
            : {}),
        },
        include: {
          products: {
            include: {
              product: {
                include: {
                  categories: {
                    include: { category: true },
                  },
                  brand: true,
                  skus: true,
                  images: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Slug already exists');
      }
      throw error;
    }
  }

  async findAll(params?: {
    page?: number;
    limit?: number;
    category?: string;
    language?: string;
    status?: string;
    search?: string;
    userId?: string;
  }): Promise<{ data: any[]; meta: any }> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (params?.userId) {
      where.userId = params.userId;
    }

    // Status filter
    const status = params?.status || 'published';
    if (status === 'published') {
      where.publishedAt = { not: null };
    } else if (status === 'draft') {
      where.publishedAt = null;
    }
    // if 'all', we don't filter by publishedAt

    if (params?.category) {
      where.category = params.category;
    }

    if (params?.language) {
      where.language = params.language;
    }

    if (params?.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { content: { contains: params.search, mode: 'insensitive' } },
        { author: { contains: params.search, mode: 'insensitive' } },
        { user: { email: { contains: params.search, mode: 'insensitive' } } },
        {
          user: { firstName: { contains: params.search, mode: 'insensitive' } },
        },
        {
          user: { lastName: { contains: params.search, mode: 'insensitive' } },
        },
      ];
    }

    const [blogs, total] = await Promise.all([
      (this.prisma.blog as any).findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
        include: {
          products: {
            include: {
              product: {
                include: {
                  categories: {
                    include: { category: true },
                  },
                  brand: true,
                  skus: true,
                  images: true,
                },
              },
            },
          },
        },
      }),
      (this.prisma.blog as any).count({ where }),
    ]);

    // Transform data to flatten products
    const data = blogs.map((blog) => ({
      ...blog,
      products: blog.products.map((bp) => bp.product),
      status: blog.publishedAt ? 'published' : 'draft',
    }));

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        limit,
      },
    };
  }

  async togglePublish(id: string) {
    const blog = await (this.prisma.blog as any).findUnique({ where: { id } });
    if (!blog) throw new Error('Blog not found');

    const isPublished = !!blog.publishedAt;
    return (this.prisma.blog as any).update({
      where: { id },
      data: {
        publishedAt: isPublished ? null : new Date(),
      },
    });
  }

  async findOne(idOrSlug: string): Promise<any> {
    const blog = await (this.prisma.blog as any).findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        publishedAt: { not: null },
        deletedAt: null,
      },
      include: {
        products: {
          include: {
            product: {
              include: {
                categories: {
                  include: { category: true },
                },
                brand: true,
                skus: true,
                images: true,
              },
            },
          },
        },
      },
    });

    if (!blog) return null;

    // Transform to flatten products
    return {
      ...blog,
      products: blog.products.map((bp) => bp.product),
    };
  }

  async getCategoryStats() {
    const stats = await (this.prisma.blog as any).groupBy({
      by: ['category'],
      where: {
        publishedAt: { not: null },
        deletedAt: null,
      },
      _count: {
        category: true,
      },
      orderBy: {
        category: 'asc',
      },
    });

    const total = await (this.prisma.blog as any).count({
      where: {
        publishedAt: { not: null },
        deletedAt: null,
      },
    });

    return {
      categories: stats.map((s) => ({
        category: s.category,
        count: s._count.category,
      })),
      total,
    };
  }

  async getStats() {
    return this.getCategoryStats();
  }

  async update(
    id: string,
    updateBlogDto: UpdateBlogDto,

    user?: any,
  ): Promise<Blog> {
    const { productIds, ...blogData } = updateBlogDto;

    const existingBlog = await (this.prisma.blog as any).findUnique({
      where: { id },
    });
    if (!existingBlog) throw new Error('Blog not found');

    if (user) {
      const hasAdminPermission = user.permissions?.includes('blog:update');
      const isOwner = existingBlog.userId === user.id;

      this.logger.debug(
        `[BlogUpdate] User: ${user.id} Permissions: ${JSON.stringify(user.permissions)}`,
      );
      this.logger.debug(
        `[BlogUpdate] IsOwner: ${isOwner} HasAdminPermission: ${hasAdminPermission}`,
      );

      if (!hasAdminPermission && !isOwner) {
        throw new Error('Forbidden resource');
      }

      // If user is updating their own post and is NOT an admin, reset status to Draft
      if (!hasAdminPermission) {
        this.logger.log('[BlogUpdate] Resetting blog status to Draft');

        (blogData as any).publishedAt = null;
      }
    }

    // If productIds provided, update the relations
    if (productIds !== undefined) {
      // Delete existing relations
      await (this.prisma.blogProduct as any).deleteMany({
        where: { blogId: id },
      });

      // Create new relations
      if (productIds.length > 0) {
        await (this.prisma.blogProduct as any).createMany({
          data: productIds.map((productId) => ({
            blogId: id,
            productId,
          })),
        });
      }
    }

    try {
      return await (this.prisma.blog as any).update({
        where: { id },
        data: blogData as any,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Slug already exists');
      }
      throw error;
    }
  }

  async remove(id: string, user?: any): Promise<Blog> {
    const existingBlog = await (this.prisma.blog as any).findUnique({
      where: { id },
    });
    if (!existingBlog) throw new Error('Blog not found');

    if (user) {
      const hasAdminPermission = user.permissions?.includes('blog:delete');
      const isOwner = existingBlog.userId === user.id;

      if (!hasAdminPermission && !isOwner) {
        throw new Error('Forbidden resource');
      }
    }

    return (this.prisma.blog as any).update({
      where: { id },
      data: {
        deletedAt: new Date(),
        slug: `${existingBlog.slug}-deleted-${Date.now()}`,
      },
    });
  }
}
