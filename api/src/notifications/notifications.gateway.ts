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
import { NotificationsService } from './notifications.service';

/**
 * =====================================================================
 * NOTIFICATIONS GATEWAY - WebSocket cho thông báo real-time
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. WEBSOCKET vs HTTP:
 * - HTTP: Client phải "hỏi" server liên tục (Polling) → Lãng phí tài nguyên
 * - WebSocket: Server "đẩy" thông báo đến client ngay lập tức → Real-time
 *
 * 2. AUTHENTICATION:
 * - Client gửi JWT token khi kết nối
 * - Server xác thực và lưu userId vào socket.data
 * - Chỉ client đúng userId mới nhận được thông báo của họ
 *
 * 3. ROOMS:
 * - Mỗi user có một "room" riêng (userId)
 * - Khi tạo thông báo, emit vào room của user đó
 * - Chỉ user trong room đó mới nhận được thông báo
 *
 * 4. USE CASES:
 * - Thông báo đơn hàng mới
 * - Thông báo trạng thái đơn hàng thay đổi
 * - Thông báo khuyến mãi
 * - Chat support (nếu mở rộng)
 * =====================================================================
 */

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, Set<string>> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Xử lý khi client kết nối
   */
  async handleConnection(client: Socket) {
    try {
      // Lấy token từ query hoặc handshake auth
      const token = client.handshake.auth.token || client.handshake.query.token;

      if (!token) {
        this.logger.debug('[WS] No token provided, disconnecting...');
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token as string);
      const userId = payload.userId;

      if (!userId) {
        this.logger.debug('[WS] Invalid token, disconnecting...');
        client.disconnect();
        return;
      }

      // Lưu userId vào socket data
      client.data.userId = userId;

      // Join user vào room riêng của họ
      client.join(`user:${userId}`);

      // Track socket connection
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)?.add(client.id);

      // Gửi số lượng thông báo chưa đọc ngay sau khi kết nối
      const unreadCount =
        await this.notificationsService.getUnreadCount(userId);
      client.emit('unread_count', { count: unreadCount });
    } catch (error) {
      this.logger.error('[WS] Connection error:', error.message);
      client.disconnect();
    }
  }

  /**
   * Xử lý khi client ngắt kết nối
   */
  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      // Remove socket from tracking
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
        }
      }
    }
  }

  /**
   * Client yêu cầu lấy danh sách thông báo
   */
  @SubscribeMessage('get_notifications')
  async handleGetNotifications(
    client: Socket,
    data: { limit?: number; offset?: number },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    const notifications = await this.notificationsService.findAll(
      userId,
      data.limit || 20,
      data.offset || 0,
    );

    client.emit('notifications_list', notifications);
  }

  /**
   * Client đánh dấu thông báo đã đọc
   */
  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(client: Socket, data: { id: string }) {
    const userId = client.data.userId;
    if (!userId) return;

    try {
      await this.notificationsService.markAsRead(data.id, userId);

      // Gửi lại số thông báo chưa đọc
      const unreadCount =
        await this.notificationsService.getUnreadCount(userId);
      client.emit('unread_count', { count: unreadCount });

      client.emit('mark_as_read_success', { id: data.id });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  /**
   * PUBLIC METHOD: Gửi thông báo mới đến user (được gọi từ service khác)
   */
  sendNotificationToUser(userId: string, notification: any) {
    // Emit vào room của user
    this.server.to(`user:${userId}`).emit('new_notification', notification);

    // Cập nhật unread count
    void this.notificationsService.getUnreadCount(userId).then((count) => {
      this.server.to(`user:${userId}`).emit('unread_count', { count });
    });

    this.logger.debug(`[WS] Sent notification to user ${userId}`);
  }

  /**
   * PUBLIC METHOD: Broadcast thông báo đến tất cả users đang online
   */
  broadcastNotification(notification: any) {
    this.server.emit('new_notification', notification);
    this.logger.debug('[WS] Broadcasted notification to all users');
  }

  /**
   * Check xem user có đang online không
   */
  isUserOnline(userId: string): boolean {
    return (
      this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0
    );
  }

  /**
   * Lấy số lượng users đang online
   */
  getOnlineUsersCount(): number {
    return this.userSockets.size;
  }
}
