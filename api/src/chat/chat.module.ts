import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService],
})
/**
 * =====================================================================
 * CHAT MODULE - Hệ thống chat realtime
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. WEBSOCKET GATEWAY (`ChatGateway`):
 * - Thay vì HTTP truyền thống (Req/Res), Chat cần kết nối 2 chiều liên tục (WebSocket).
 * - `ChatGateway` đóng vai trò như "Controller" cho các sự kiện Socket.io.
 *
 * 2. JWT AUTH IN SOCKET:
 * - Socket cũng cần bảo mật (Biết ai đang chat).
 * - Cần import `JwtModule` để verify token gửi kèm trong handshake của Socket kết nối.
 * =====================================================================
 */
export class ChatModule {}
