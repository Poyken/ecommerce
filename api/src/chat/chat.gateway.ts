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
      }

      this.logger.log(`[Chat] User ${userId} connected`);
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Cleanup if needed
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    client: Socket,
    payload: { content: string; toUserId?: string; clientTempId?: string },
  ) {
    const userId = client.data.userId;
    const roles = client.data.roles || [];

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    let senderType: 'USER' | 'ADMIN' = 'USER';
    let targetUserId = userId; // Default: User sending to Admin (so target conversation is their own)

    const isAdmin = roles.some(
      (r: string) =>
        r.toUpperCase() === 'ADMIN' || r.toUpperCase() === 'SUPER_ADMIN',
    );

    if (isAdmin) {
      senderType = 'ADMIN';
      if (!payload.toUserId) {
        // If admin is replying to a conversation, toUserId must be provided
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
      );

      const messageWithTempId = {
        ...message,
        clientTempId: payload.clientTempId,
      };

      // Broadcast to User Room
      this.server
        .to(`user:${targetUserId}`)
        .emit('newMessage', messageWithTempId);

      // Broadcast to Admin Room (so all admins see it)
      this.server.to('admin-room').emit('newMessage', messageWithTempId);

      return { success: true, data: message };
    } catch (error) {
      this.logger.error(error);
      return { success: false, error: error.message };
    }
  }
}
