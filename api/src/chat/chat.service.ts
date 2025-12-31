import { PrismaService } from '@core/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SenderType } from '@prisma/client';

/**
 * =====================================================================
 * CHAT SERVICE - HỆ THỐNG CHĂM SÓC KHÁCH HÀNG TRỰC TUYẾN
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CONVERSATION MODEL (Mô hình hội thoại):
 * - Mỗi User sẽ có 1 `ChatConversation` duy nhất với Admin.
 * - Mọi tin nhắn (`ChatMessage`) đều thuộc về hội thoại này.
 *
 * 2. MESSAGE TYPES:
 * - Hệ thống hỗ trợ nhiều loại tin nhắn: TEXT, IMAGE, PRODUCT (gửi thông tin sản phẩm), ORDER (gửi thông tin đơn hàng).
 * - Điều này giúp việc hỗ trợ khách hàng trở nên trực quan hơn.
 *
 * 3. DATA PRUNING (Dọn dẹp dữ liệu):
 * - Chat sinh ra rất nhiều dữ liệu rác. Hàm `pruneOldMessages` chạy định kỳ hàng tuần để xóa các tin nhắn cũ hơn 180 ngày, giữ cho DB luôn nhẹ nhàng.
 * =====================================================================
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * [P14 OPTIMIZATION] Automated Chat Pruning (Weekly)
   * Purge messages older than 180 days to keep DB lean.
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
   * Finds or creates a conversation for a user
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
   * Save a new message
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
    // If I am ADMIN, I want to mark messages FROM USER as read.
    // So senderTypeToCheck should be the OTHER party.
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
   * For Admin: List latest conversations
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
