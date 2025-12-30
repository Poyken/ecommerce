import { PrismaService } from '@core/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { SenderType } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Finds or creates a conversation for a user
   */
  async getConversation(userId: string) {
    let conversation = await this.prisma.chatConversation.findFirst({
      where: { userId },
      include: {
        messages: {
          orderBy: { sentAt: 'asc' },
          take: 50, // Limit initial load
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
        },
      });
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
