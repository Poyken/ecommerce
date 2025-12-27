# Chat Feature Implementation Plan

## 1. Overview

Implement a real-time chat system to allow users to contact support (Admin) directly from the store.

## 2. Architecture

### Backend (NestJS)

- **Technology**: `Socket.IO` (Wait, we should use `@nestjs/platform-socket.io`).
- **Gateway**: `ChatGateway` handling events: `join_room`, `send_message`, `typing`.
- **Database (Prisma)**:
  - **Conversation**: `id`, `userId` (customer), `adminId` (optional), `createdAt`, `updatedAt`, `status` (OPEN, CLOSED).
  - **Message**: `id`, `conversationId`, `senderId`, `content`, `createdAt`, `isRead`.

### Frontend (User - Next.js)

- **Component**: `ChatWidget` (Already created UI).
- **Socket Hook**: `useChatSocket` to handle connection and events.
- **State**: `localMessages` list, `isTyping`.
- **UI**:
  - Floating Button -> Expands to Chat Window.
  - Message List (Bubble style).
  - Input Area.

### Frontend (Admin - Next.js)

- **Inbox Page**: `/admin/chat` (New route).
- **Sidebar**: List of active conversations (Real-time updates).
- **Chat Window**: Similar to User but with "Customer Info" panel.

## 3. Detailed Steps

### Phase 1: Backend Setup

1. Define Prisma Schema (`Conversation`, `Message`).
2. Generate Migrations.
3. Create `ChatModule`, `ChatService`, `ChatGateway` in API.
4. Implement Auth Guard for Socket (JWT Validation from Handshake auth header).

### Phase 2: User Chat Widget

1. Enhance `ChatWidget` to open a popover.
2. Implement `ChatWindow` component (Message List + Input).
3. Integrate `socket.io-client`.
4. Handle "Connect" -> `emit('join_conversation')`.

### Phase 3: Admin Dashboard

1. Create Admin Chat Layout.
2. Implement "New Message" notifications for Admin.

## 4. Considerations

- **Offline Messages**: Send email if admin is offline?
- **File Uploads**: Support images in chat? (Phase 2).
- **Bot**: Simple auto-reply "We will be with you shortly".
