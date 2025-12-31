import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

/**
 * =====================================================================
 * CHAT GATEWAY - CỔNG KẾT NỐI WEBSOCKET THỜI GIAN THỰC
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. WEBSOCKET (Bi-directional):
 * - Khác với HTTP (Client gọi -> Server trả lời), WebSocket cho phép Server chủ động gửi dữ liệu về Client bất cứ lúc nào (Real-time).
 * - Dùng cho tính năng Chat, thông báo đơn hàng mới, v.v.
 *
 * 2. ROOMS (Phòng chat):
 * - `handleConnection`: Khi user kết nối, ta cho họ vào một "phòng" riêng (`user:userId`).
 * - Admin sẽ vào phòng `admin-room` để nhận tất cả tin nhắn từ mọi khách hàng.
 *
 * 3. SURGICAL EMITS:
 * - Thay vì gửi nguyên object DB cồng kềnh, ta chỉ gửi những field cần thiết (Sanitization) qua socket để tiết kiệm băng thông.
 * =====================================================================
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
  ) {}

  handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.query.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token as string);
      const userId = payload.userId;
      const roles = payload.roles || []; // Use roles array

      if (!userId) {
        client.disconnect();
        return;
      }

      client.data.userId = userId;
      client.data.roles = roles;

      // Join user specific room
      client.join(`user:${userId}`);

      // If admin, join admin room
      const isAdmin = roles.some(
        (r: string) =>
          r.toUpperCase() === 'ADMIN' || r.toUpperCase() === 'SUPER_ADMIN',
      );

      if (isAdmin) {
        client.join('admin-room');
        this.logger.log(`[Chat] Admin ${userId} joined admin-room`);
      }

      this.logger.log(`[Chat] User ${userId} connected`);
    } catch (error) {
      client.disconnect();
    }
  }

  private readonly cooldowns = new Map<string, number>();

  @SubscribeMessage('sendMessage')
  async handleMessage(client: Socket, payload: any) {
    const userId = client.data.userId;
    const roles = client.data.roles || [];

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // [P14 OPTIMIZATION] WebSocket Throttling (200ms cooldown)
    const now = Date.now();
    const lastMessageTime = this.cooldowns.get(client.id) || 0;
    if (now - lastMessageTime < 200) {
      return { success: false, error: 'Throttled: Please wait 0.2 second' };
    }
    this.cooldowns.set(client.id, now);

    let senderType: 'USER' | 'ADMIN' = 'USER';
    let targetUserId = userId; // Default: User sending to Admin

    const isAdmin = roles.some(
      (r: string) =>
        r.toUpperCase() === 'ADMIN' || r.toUpperCase() === 'SUPER_ADMIN',
    );

    if (isAdmin) {
      senderType = 'ADMIN';
      if (!payload.toUserId) {
        return { success: false, error: 'Admin must specify toUserId' };
      }
      targetUserId = payload.toUserId;
    }

    try {
      // Save to DB
      const message = await this.chatService.saveMessage(
        targetUserId,
        payload.content,
        senderType as any,
        userId,
        payload.type || 'TEXT',
        payload.metadata,
      );

      // [P14 OPTIMIZATION] Surgical Serialization for Emits
      const sanitizedMessage = {
        id: message.id,
        conversationId: message.conversationId,
        content: message.content,
        type: message.type,
        senderId: message.senderId,
        senderType: message.senderType,
        sentAt: message.sentAt,
        metadata: message.metadata,
        clientTempId: payload.clientTempId,
      };

      // Broadcast to User Room
      // Broadcast to User Room
      this.logger.log(`[Chat] Broadcasting to user:${targetUserId}`);
      this.server
        .to(`user:${targetUserId}`)
        .emit('newMessage', sanitizedMessage);

      // Broadcast to Admin Room
      this.logger.log(`[Chat] Broadcasting to admin-room`);
      this.server.to('admin-room').emit('newMessage', sanitizedMessage);

      return { success: true, data: sanitizedMessage };
    } catch (error) {
      this.logger.error(
        `[ChatGateway] HandleMessage Error: ${error.message}`,
        error.stack,
      );
      return { success: false, error: error.message };
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`[ChatGateway] Disconnected: ${client.id}`);
    this.cooldowns.delete(client.id);
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    client: Socket,
    payload: { conversationId: string; targetUserId?: string },
  ) {
    const userId = client.data.userId;
    const roles = client.data.roles || [];

    if (!userId) return; // Silent fail

    const isAdmin = roles.some(
      (r: string) =>
        r.toUpperCase() === 'ADMIN' || r.toUpperCase() === 'SUPER_ADMIN',
    );

    if (isAdmin) {
      // Admin marking User's messages as read
      if (!payload.conversationId) return;

      // Mark messages FROM USER as read in this conversation
      await this.chatService.markAsRead(payload.conversationId, 'USER' as any);

      // Notify other admins that this conversation is read (optional, to update their UI)
      // And maybe notify the user that their message was read?
      this.server.to('admin-room').emit('conversationRead', {
        conversationId: payload.conversationId,
        readBy: userId,
      });
    } else {
      // User marking Admin's messages as read
      // User only has one conversation usually
      // Retrieve conversation ID if not passed, or trust passed one if valid ownership
      const conversation = await this.chatService.getConversation(userId);
      if (conversation) {
        await this.chatService.markAsRead(conversation.id, 'ADMIN' as any);
        // Notify Admin that user read the message
        this.server.to('admin-room').emit('messageRead', {
          conversationId: conversation.id,
          userId,
        });
      }
    }
  }
}
