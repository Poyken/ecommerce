import { PrismaService } from '@core/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SenderType } from '@prisma/client';

/**
 * =====================================================================
 * CHAT SERVICE - HỆ THỐNG CHĂM SÓC KHÁCH HÀNG TRỰC TUYẾN
 * =====================================================================
 *
 * =====================================================================
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * [P14 OPTIMIZATION] Tự động xóa tin nhắn cũ (Pruning Weekly).
   * - Xóa tin nhắn quá 180 ngày để giải phóng dung lượng DB.
   */
  @Cron(CronExpression.EVERY_WEEK)
  async pruneOldMessages(daysOld = 180) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    try {
      const result = await this.prisma.chatMessage.deleteMany({
        where: {
          sentAt: { lt: cutoffDate },
        },
      });

      if (result.count > 0) {
        this.logger.log(
          `[Prune] Chat messages cleanup complete. Removed ${result.count} records older than ${daysOld} days.`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to prune chat messages:', error);
    }
  }

  /**
   * Tìm hoặc tạo mới cuộc hội thoại hội thoại cho một user.
   * - Nếu chưa có hội thoại, tự động tạo mới.
   * - Load sẵn 50 tin nhắn mới nhất.
   */
  async getConversation(userId: string) {
    let conversation = await this.prisma.chatConversation.findFirst({
      where: { userId },
      include: {
        messages: {
          orderBy: { sentAt: 'desc' }, // Get LATEST messages
          take: 50, // Limit initial load
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderType: SenderType.ADMIN,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      conversation = await this.prisma.chatConversation.create({
        data: {
          userId,
        },
        include: {
          messages: true,
          _count: {
            select: { messages: true }, // Include count even on create
          },
        },
      });
    }

    if (conversation) {
      // [P14 FIX] Sort by DESC to get the LATEST 50 messages, then reverse to ASC for display
      conversation.messages = conversation.messages.sort(
        (a, b) => a.sentAt.getTime() - b.sentAt.getTime(),
      );
    }

    return conversation;
  }

  /**
   * Lưu tin nhắn mới vào DB.
   * - Hỗ trợ gửi text, hình ảnh, sản phẩm, đơn hàng.
   * - Cập nhật `updatedAt` của Conversation để sort danh sách chat cho Admin.
   */
  async saveMessage(
    userId: string,
    content: string,
    senderType: SenderType,
    senderId: string,
    type: 'TEXT' | 'IMAGE' | 'PRODUCT' | 'ORDER' = 'TEXT',
    metadata?: any,
  ) {
    this.logger.log(
      `[ChatService] saveMessage: saving for conversationOwner=${userId} sender=${senderId} type=${senderType}`,
    );
    // Ensure conversation exists
    let conversation = await this.prisma.chatConversation.findFirst({
      where: { userId },
    });

    if (!conversation) {
      conversation = await this.prisma.chatConversation.create({
        data: { userId },
      });
    }

    // Update conversation timestamp
    await this.prisma.chatConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    // Create message
    const message = await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        content,
        senderType,
        senderId,
        type,
        metadata: metadata || undefined,
        isRead: false,
      },
    });

    return message;
  }

  async markAsRead(conversationId: string, senderTypeToCheck: SenderType) {
    // Nếu tôi là ADMIN, tôi muốn đánh dấu tin nhắn TỪ USER là đã đọc.
    // Nên `senderTypeToCheck` sẽ là phía bên kia (USER).
    await this.prisma.chatMessage.updateMany({
      where: {
        conversationId,
        senderType: senderTypeToCheck,
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  /**
   * Dành cho Admin: Lấy danh sách các cuộc hội thoại mới nhất.
   * - Sắp xếp theo thời gian tin nhắn cuối cùng (`updatedAt`).
   * - Kèm theo số lượng tin chưa đọc (`unreadCount`).
   */
  async getAdminConversations(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // Get conversations with latest message info
    const conversations = await this.prisma.chatConversation.findMany({
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: { isRead: false, senderType: SenderType.USER },
            },
          }, // Count unread messages from user
        },
      },
    });

    const total = await this.prisma.chatConversation.count();

    return {
      data: conversations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
