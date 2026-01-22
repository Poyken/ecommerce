import { Logger, Inject, forwardRef } from '@nestjs/common';
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
    @Inject(forwardRef(() => NotificationsService))
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
  sendNotificationToUser(
    userId: string,
    notification: Record<string, unknown>,
  ) {
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
  broadcastNotification(notification: Record<string, unknown>) {
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
