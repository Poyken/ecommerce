import { Injectable } from '@nestjs/common';
import { Blog } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  async create(createBlogDto: CreateBlogDto): Promise<Blog> {
    const { productIds, ...blogData } = createBlogDto;

    return this.prisma.blog.create({
      data: {
        ...blogData,
        publishedAt: new Date(),
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
                category: true,
                brand: true,
                skus: true,
                images: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(params?: {
    page?: number;
    limit?: number;
    category?: string;
    language?: string;
  }): Promise<{ data: any[]; meta: any }> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      publishedAt: { not: null },
      deletedAt: null,
    };

    if (params?.category) {
      where.category = params.category;
    }

    if (params?.language) {
      where.language = params.language;
    }

    const [blogs, total] = await Promise.all([
      this.prisma.blog.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
        include: {
          products: {
            include: {
              product: {
                include: {
                  category: true,
                  brand: true,
                  skus: true,
                  images: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.blog.count({ where }),
    ]);

    // Transform data to flatten products
    const data = blogs.map((blog) => ({
      ...blog,
      products: blog.products.map((bp) => bp.product),
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

  async findOne(idOrSlug: string): Promise<any | null> {
    const blog = await this.prisma.blog.findFirst({
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
                category: true,
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

  async update(id: string, updateBlogDto: UpdateBlogDto): Promise<Blog> {
    const { productIds, ...blogData } = updateBlogDto;

    // If productIds provided, update the relations
    if (productIds !== undefined) {
      // Delete existing relations
      await this.prisma.blogProduct.deleteMany({
        where: { blogId: id },
      });

      // Create new relations
      if (productIds.length > 0) {
        await this.prisma.blogProduct.createMany({
          data: productIds.map((productId) => ({
            blogId: id,
            productId,
          })),
        });
      }
    }

    return this.prisma.blog.update({
      where: { id },
      data: blogData,
    });
  }

  async remove(id: string): Promise<Blog> {
    return this.prisma.blog.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
