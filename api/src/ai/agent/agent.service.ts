/**
 * =====================================================================
 * AGENT.SERVICE SERVICE
 * =====================================================================
 *
 * =====================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '@/ai/ai-chat/gemini.service';
import { ProductsService } from '@/catalog/products/products.service';
import { PrismaService } from '@core/prisma/prisma.service';

/**
 * =============================================================================
 * AGENT SERVICE - BỘ NÃO CỦA AGENT
 * =============================================================================
 *
 * Service này chịu trách nhiệm:
 * 1. Phân tích lệnh ngôn ngữ tự nhiên → TaskPlan
 * 2. Thực thi các Task theo thứ tự
 * 3. Trả về kết quả tổng hợp
 *
 * =============================================================================
 */

// Định nghĩa các loại Task mà Agent có thể thực hiện
export type TaskType =
  | 'QUERY_PRODUCTS'
  | 'UPDATE_PRICE'
  | 'GENERATE_CONTENT'
  | 'SEND_EMAIL'
  | 'UNKNOWN';

export interface AgentTask {
  type: TaskType;
  params: Record<string, any>;
  description: string;
}

export interface TaskPlan {
  intent: string;
  tasks: AgentTask[];
}

export interface TaskResult {
  task: AgentTask;
  success: boolean;
  data?: any;
  error?: string;
}

export interface AgentExecutionResult {
  command: string;
  plan: TaskPlan;
  results: TaskResult[];
  summary: string;
}

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    private readonly geminiService: GeminiService,
    private readonly productsService: ProductsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Thực thi một lệnh từ Admin
   */
  async executeCommand(command: string): Promise<AgentExecutionResult> {
    this.logger.log(`Executing command: "${command}"`);

    // 1. Phân tích lệnh thành TaskPlan
    const plan = await this.parseIntent(command);
    this.logger.log(`Parsed plan with ${plan.tasks.length} tasks`);

    // 2. Thực thi từng Task
    const results: TaskResult[] = [];
    for (const task of plan.tasks) {
      const result = await this.executeTask(task);
      results.push(result);

      // Nếu task thất bại, dừng lại (có thể tùy chỉnh để tiếp tục)
      if (!result.success) {
        this.logger.warn(`Task failed: ${task.type} - ${result.error}`);
        break;
      }
    }

    // 3. Tạo tóm tắt
    const summary = this.generateSummary(command, results);

    return {
      command,
      plan,
      results,
      summary,
    };
  }

  /**
   * Phân tích lệnh ngôn ngữ tự nhiên thành TaskPlan
   */
  private async parseIntent(command: string): Promise<TaskPlan> {
    const prompt = `
You are an e-commerce admin assistant. Analyze this command and return a JSON task plan.

COMMAND: "${command}"

Available task types:
- QUERY_PRODUCTS: Find products. Params: { search?: string, categoryId?: string, minStock?: number, maxStock?: number, limit?: number }
- UPDATE_PRICE: Update product/SKU prices. Params: { productIds?: string[], skuIds?: string[], discountPercent?: number, newPrice?: number }
- GENERATE_CONTENT: Generate marketing content. Params: { type: 'email' | 'description', products?: any[], tone?: string }
- SEND_EMAIL: Send emails to customers. Params: { subject: string, content: string, customerIds?: string[], segment?: string }

Return ONLY valid JSON:
{
  "intent": "Brief description of what user wants",
  "tasks": [
    { "type": "TASK_TYPE", "params": {...}, "description": "What this task does" }
  ]
}

If you cannot understand the command, return:
{ "intent": "Unknown", "tasks": [{ "type": "UNKNOWN", "params": {}, "description": "Could not parse command" }] }
`;

    try {
      const response = await this.geminiService.generateResponse(prompt, '');
      // Clean up markdown code blocks if present
      const jsonStr = response.replace(/```json|```/g, '').trim();
      const plan = JSON.parse(jsonStr) as TaskPlan;
      return plan;
    } catch (error) {
      this.logger.error('Failed to parse intent', error);
      return {
        intent: 'Parse Error',
        tasks: [
          {
            type: 'UNKNOWN',
            params: {},
            description: 'Failed to parse command',
          },
        ],
      };
    }
  }

  /**
   * Thực thi một Task cụ thể
   */
  private async executeTask(task: AgentTask): Promise<TaskResult> {
    this.logger.log(`Executing task: ${task.type}`);

    try {
      switch (task.type) {
        case 'QUERY_PRODUCTS':
          return await this.executeQueryProducts(task);

        case 'UPDATE_PRICE':
          return await this.executeUpdatePrice(task);

        case 'GENERATE_CONTENT':
          return await this.executeGenerateContent(task);

        case 'SEND_EMAIL':
          return this.executeSendEmail(task);

        case 'UNKNOWN':
        default:
          return {
            task,
            success: false,
            error: 'Unknown task type or could not understand command',
          };
      }
    } catch (error) {
      return {
        task,
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Task: Query Products
   */
  private async executeQueryProducts(task: AgentTask): Promise<TaskResult> {
    const { search, categoryId, minStock, maxStock, limit = 10 } = task.params;

    const products = await this.prisma.product.findMany({
      where: {
        deletedAt: null,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(categoryId && {
          categories: {
            some: { categoryId },
          },
        }),
      },
      take: limit,
      include: {
        skus: {
          where: {
            status: 'ACTIVE',
            ...(minStock !== undefined && { stock: { gte: minStock } }),
            ...(maxStock !== undefined && { stock: { lte: maxStock } }),
          },
          take: 1,
        },
        categories: {
          include: {
            category: { select: { name: true } },
          },
        },
        images: { take: 1, select: { url: true } },
      },
    });

    return {
      task,
      success: true,
      data: {
        count: products.length,
        products: products.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.categories[0]?.category.name,
          price: p.skus[0]?.price,
          stock: p.skus[0]?.stock,
          image: p.images[0]?.url,
        })),
      },
    };
  }

  /**
   * Task: Update Price
   */
  private async executeUpdatePrice(task: AgentTask): Promise<TaskResult> {
    const { productIds, skuIds, discountPercent, newPrice } = task.params;

    let updatedCount = 0;

    if (skuIds && skuIds.length > 0) {
      // Update specific SKUs
      for (const skuId of skuIds) {
        const sku = await this.prisma.sku.findUnique({ where: { id: skuId } });
        if (!sku) continue;

        const currentPrice = Number(sku.price);
        const finalPrice = discountPercent
          ? currentPrice * (1 - discountPercent / 100)
          : newPrice;

        await this.prisma.sku.update({
          where: { id: skuId },
          data: { salePrice: finalPrice },
        });
        updatedCount++;
      }
    } else if (productIds && productIds.length > 0) {
      // Update all SKUs of products
      for (const productId of productIds) {
        const skus = await this.prisma.sku.findMany({
          where: { productId, status: 'ACTIVE' },
        });

        for (const sku of skus) {
          const currentPrice = Number(sku.price);
          const finalPrice = discountPercent
            ? currentPrice * (1 - discountPercent / 100)
            : newPrice;

          await this.prisma.sku.update({
            where: { id: sku.id },
            data: { salePrice: finalPrice },
          });
          updatedCount++;
        }
      }
    }

    return {
      task,
      success: true,
      data: {
        updatedSkuCount: updatedCount,
        discountApplied: discountPercent ? `${discountPercent}%` : null,
        newPriceSet: newPrice || null,
      },
    };
  }

  /**
   * Task: Generate Content
   */
  private async executeGenerateContent(task: AgentTask): Promise<TaskResult> {
    const { type, products, tone = 'professional' } = task.params;

    let content = '';

    if (type === 'email') {
      const productList = products
        ? products.map((p: any) => `- ${p.name}: ${p.price}`).join('\n')
        : 'Selected products';

      const prompt = `
Write a short, ${tone} marketing email in Vietnamese for an e-commerce store.
The email should promote these products:
${productList}

Keep it under 150 words. Include a catchy subject line.
Format: 
Subject: [subject here]
---
[email body here]
`;
      content = await this.geminiService.generateResponse(prompt, '');
    } else if (type === 'description') {
      const prompt = `
Write a compelling product description in Vietnamese for:
${JSON.stringify(products?.[0] || 'a premium product')}

Keep it SEO-friendly, under 100 words.
`;
      content = await this.geminiService.generateResponse(prompt, '');
    }

    return {
      task,
      success: true,
      data: { content },
    };
  }

  /**
   * Task: Send Email (Simulated - in production would use real email service)
   */
  private executeSendEmail(task: AgentTask): TaskResult {
    const { subject, content, customerIds, segment } = task.params;

    // In production, this would:
    // 1. Query customers based on segment or IDs
    // 2. Send actual emails via NotificationService

    // For now, we simulate
    const simulatedRecipients =
      segment === 'all' ? 100 : customerIds?.length || 10;

    this.logger.log(
      `[SIMULATED] Sending email to ${simulatedRecipients} customers`,
    );
    this.logger.log(`Subject: ${subject}`);

    return {
      task,
      success: true,
      data: {
        emailsSent: simulatedRecipients,
        subject,
        preview: content?.substring(0, 100) + '...',
        note: 'Email sending is simulated in development',
      },
    };
  }

  /**
   * Tạo tóm tắt kết quả thực thi
   */
  private generateSummary(command: string, results: TaskResult[]): string {
    const successfulTasks = results.filter((r) => r.success);
    const failedTasks = results.filter((r) => !r.success);

    const summary = `
Đã thực thi lệnh: "${command}"
- Tổng số tasks: ${results.length}
- Thành công: ${successfulTasks.length}
- Thất bại: ${failedTasks.length}
${successfulTasks.map((r) => `✅ ${r.task.description}`).join('\n')}
${failedTasks.map((r) => `❌ ${r.task.description}: ${r.error}`).join('\n')}
`.trim();

    return summary;
  }

  /**
   * =============================================================================
   * GENERATIVE UI - Tạo giao diện động dựa trên câu hỏi
   * =============================================================================
   */

  async generateUI(query: string): Promise<UISchema> {
    this.logger.log(`Generating UI for query: "${query}"`);

    // 1. Phân tích query và quyết định loại UI phù hợp
    const uiType = await this.determineUIType(query);

    // 2. Fetch dữ liệu liên quan
    const data = await this.fetchDataForUI(uiType, query);

    // 3. Tạo UI Schema
    const schema = this.buildUISchema(uiType, data, query);

    return schema;
  }

  private async determineUIType(query: string): Promise<UISchemaType> {
    const prompt = `
Analyze this dashboard query and determine the best UI type to display the result.

QUERY: "${query}"

Available UI types:
- stat_card: For single KPI values (e.g., "Tổng doanh thu", "Số đơn hàng")
- table: For lists of items (e.g., "Top sản phẩm", "Đơn hàng gần đây")
- bar_chart: For comparisons (e.g., "So sánh doanh số", "Phân tích theo danh mục")
- line_chart: For trends over time (e.g., "Doanh số tuần này", "Xu hướng")
- pie_chart: For proportions (e.g., "Tỷ lệ", "Phân bổ")
- alert: For warnings/notifications (e.g., "Cảnh báo", "Hàng sắp hết")
- list: For simple bullet lists

Return ONLY one of: stat_card, table, bar_chart, line_chart, pie_chart, alert, list
`;

    try {
      const response = await this.geminiService.generateResponse(prompt, '');
      const type = response.trim().toLowerCase() as UISchemaType;
      const validTypes: UISchemaType[] = [
        'stat_card',
        'table',
        'bar_chart',
        'line_chart',
        'pie_chart',
        'alert',
        'list',
      ];
      return validTypes.includes(type) ? type : 'stat_card';
    } catch (error) {
      return 'stat_card';
    }
  }

  private async fetchDataForUI(
    uiType: UISchemaType,
    query: string,
  ): Promise<any> {
    const lowerQuery = query.toLowerCase();

    // Revenue/Sales related
    if (
      lowerQuery.includes('doanh') ||
      lowerQuery.includes('revenue') ||
      lowerQuery.includes('sales')
    ) {
      const orders = await this.prisma.order.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          paymentStatus: 'PAID',
        },
        select: { totalAmount: true, createdAt: true },
      });

      if (uiType === 'line_chart' || uiType === 'bar_chart') {
        // Group by day
        const dailyData: Record<string, number> = {};
        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        orders.forEach((o) => {
          const day = days[new Date(o.createdAt).getDay()];
          dailyData[day] = (dailyData[day] || 0) + Number(o.totalAmount);
        });
        return Object.entries(dailyData).map(([day, value]) => ({
          day,
          value,
        }));
      }

      return {
        value: orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
        label: 'Doanh thu 7 ngày',
      };
    }

    // Products/Top products
    if (
      lowerQuery.includes('sản phẩm') ||
      lowerQuery.includes('product') ||
      lowerQuery.includes('top')
    ) {
      const products = await this.prisma.product.findMany({
        take: 5,
        orderBy: { reviewCount: 'desc' },
        select: {
          name: true,
          minPrice: true,
          reviewCount: true,
          images: { take: 1, select: { url: true } },
        },
      });
      return products.map((p) => ({
        name: p.name,
        price: Number(p.minPrice),
        reviews: p.reviewCount,
        image: p.images[0]?.url,
      }));
    }

    // Orders
    if (lowerQuery.includes('đơn') || lowerQuery.includes('order')) {
      const count = await this.prisma.order.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });
      return { value: count, label: 'Đơn hàng hôm nay' };
    }

    // Stock alerts
    if (
      lowerQuery.includes('tồn') ||
      lowerQuery.includes('stock') ||
      lowerQuery.includes('hết')
    ) {
      const lowStock = await this.prisma.sku.findMany({
        where: { stock: { lte: 10 }, status: 'ACTIVE' },
        take: 5,
        include: { product: { select: { name: true } } },
      });
      return lowStock.map((s) => ({
        product: s.product.name,
        sku: s.skuCode,
        stock: s.stock,
      }));
    }

    // Default
    return { value: 0, label: 'Không có dữ liệu' };
  }

  private buildUISchema(
    type: UISchemaType,
    data: any,
    query: string,
  ): UISchema {
    switch (type) {
      case 'stat_card':
        return {
          type: 'stat_card',
          title: data.label || 'Thống kê',
          data: {
            value: data.value,
            trend: '+12%',
            trendUp: true,
          },
        };

      case 'table':
        return {
          type: 'table',
          title: 'Danh sách',
          data: {
            columns: Object.keys(data[0] || {}).map((key) => ({
              key,
              label: key.charAt(0).toUpperCase() + key.slice(1),
            })),
            rows: data,
          },
        };

      case 'bar_chart':
      case 'line_chart':
        return {
          type,
          title: query,
          data: {
            labels: data.map((d: any) => d.day || d.name || 'N/A'),
            values: data.map((d: any) => d.value || d.price || 0),
          },
        };

      case 'pie_chart':
        return {
          type: 'pie_chart',
          title: query,
          data: {
            labels: data.map((d: any) => d.name || 'N/A'),
            values: data.map((d: any) => d.value || d.count || 0),
          },
        };

      case 'alert':
        return {
          type: 'alert',
          title: 'Cảnh báo',
          data: {
            level: 'warning',
            message: `Có ${data.length} sản phẩm cần chú ý`,
            items: data,
          },
        };

      case 'list':
      default:
        return {
          type: 'list',
          title: query,
          data: {
            items: Array.isArray(data)
              ? data.map((d: any) => d.name || JSON.stringify(d))
              : [JSON.stringify(data)],
          },
        };
    }
  }
}

// =============================================================================
// TYPES FOR GENERATIVE UI
// =============================================================================

export type UISchemaType =
  | 'stat_card'
  | 'table'
  | 'bar_chart'
  | 'line_chart'
  | 'pie_chart'
  | 'alert'
  | 'list';

export interface UISchema {
  type: UISchemaType;
  title: string;
  data: any;
}
