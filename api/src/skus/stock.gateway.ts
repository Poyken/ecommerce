import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

/**
 * =====================================================================
 * STOCK GATEWAY - Cập nhật tồn kho thời gian thực
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. REAL-TIME INVENTORY:
 * - Khi có sự thay đổi tồn kho (đặt hàng, hủy đơn, nhập hàng), server sẽ
 *   broadcast sự thay đổi đó đến tất cả các client đang xem sản phẩm.
 *
 * 2. ROOM-BASED UPDATES (Optimized):
 * - Thay vì gửi cho tất cả mọi người, ta có thể chia room theo productId.
 * - Client vào trang sản phẩm sẽ join room `product:id`.
 * - Tiết kiệm băng thông cho client không quan tâm sản phẩm đó.
 * =====================================================================
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/stock',
})
export class StockGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(StockGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    // console.log(`[StockWS] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    // console.log(`[StockWS] Client disconnected: ${client.id}`);
  }

  /**
   * Client join vào room của sản phẩm để nhận update
   */
  @SubscribeMessage('join_product')
  handleJoinProduct(client: Socket, productId: string) {
    client.join(`product:${productId}`);
    // this.logger.log(`Client ${client.id} joined product room: ${productId}`);
  }

  /**
   * Client rời khỏi room sản phẩm
   */
  @SubscribeMessage('leave_product')
  handleLeaveProduct(client: Socket, productId: string) {
    client.leave(`product:${productId}`);
    // this.logger.log(`Client ${client.id} left product room: ${productId}`);
  }

  /**
   * PUBLIC METHOD: Gửi thông tin cập nhật tồn kho
   * @param productId ID sản phẩm (Room)
   * @param skuId ID biến thể cụ thể
   * @param newStock Số lượng tồn kho mới
   */
  emitStockUpdate(productId: string, skuId: string, newStock: number) {
    this.server.to(`product:${productId}`).emit('stock_updated', {
      skuId,
      stock: newStock,
    });
    // also broadcast to global for cart updates elsewhere if needed
    this.server.emit('global_stock_updated', { skuId, stock: newStock });
  }
}
