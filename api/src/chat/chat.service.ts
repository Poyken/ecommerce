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
        isRead: false,
      },
    });

    return message;
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
