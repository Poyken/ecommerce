# Skill: Debugging in Project

> **Context:** NestJS, Prisma, Winston Logger, Jest.
> **Kích hoạt:** Khi AI cần fix bug hoặc analyze lỗi.

## Trigger Phrases

Kích hoạt Skill này khi gặp:

**Tiếng Việt:**

- "Sao nó lỗi thế?", "Lỗi rồi", "Không chạy được"
- "Check giùm cái này", "Debug function này"
- "Tại sao bị crash?", "API trả về 500"

**English:**

- "Why is this failing?", "Can you debug this?"
- "It's not working", "Getting an error"
- "API returns 500", "Unhandled exception"

**Context Detection:**

- Thấy user paste error stack trace hoặc log lỗi
- User đề cập đến "exception", "error", "fail", "crash"
- Response có chứa `statusCode >= 400`

---

## 1. Tooling & Environment

- **Log Location:** `logs/error.log` (Production) hoặc Terminal Output (Dev).
- **Test Runner:** Jest (`npm run test ...`).
- **DB Inspection:** Prisma Studio (`npx prisma studio`).

## 2. Error Response Pattern (API)

Project sử dụng `AllExceptionsFilter` (`src/core/filters/all-exceptions.filter.ts`) để chuẩn hóa lỗi.
Mọi API trả về lỗi đều có dạng:

```json
{
  "success": false,
  "error": {
    "statusCode": 400,
    "message": "Chi tiết lỗi user-friendly",
    "code": "BadRequestException",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "path": "/api/v1/orders"
  }
}
```

**Common Prisma Errors Mapped:**

- `P2025` -> 404 Not Found (Record missing).
- `P2002` -> 409 Conflict (Unique constraint).
- `P2003` -> 400 Bad Request (Foreign key constraint).

## 3. How to Reproduce (Testing)

Luôn ưu tiên viết Test Case tái hiện lỗi trước khi fix.

**Template Test:**

```typescript
describe('Debugging [Feature]', () => {
  it('should reproduce bug [Issue-ID]', async () => {
    // 1. Prepare Data
    const input = { ... };
    // 2. Call Service/Controller
    await expect(service.method(input))
      .rejects
      // 3. Assert Error
      .toThrow(BadRequestException);
  });
});
```

**Run specific test:**

```bash
npm run test -- src/path/to/buggy.spec.ts
```

## 4. How to Log (Convention)

Thêm log vào code để trace flow. **KHÔNG** dùng `console.log`.

**Inject Logger:**

```typescript
import { Logger } from '@nestjs/common';

export class MyService {
  private readonly logger = new Logger(MyService.name); // Class Name làm context

  method() {
    this.logger.debug('Validation Input', { userId: 1, amount: 100 });

    try {
      // Logic...
    } catch (e) {
      this.logger.error('Critical Fail during X', e.stack);
      throw e;
    }
  }
}
```

## 5. Common Pitfalls (Các lỗi kinh điển)

1.  **Prisma Select Misspell:**
    - _Lỗi:_ `Cannot read property 'x' of null`.
    - _Nguyên nhân:_ Quên `include` hoặc `select` field đó trong Prisma Query.
    - _Fix:_ Check lại query prisma.

2.  **Env Var Missing:**
    - _Lỗi:_ `Connection Refused` hoặc `Auth Failed`.
    - _Fix:_ Check `src/core/config/constants.ts` xem đã map với `.env` chưa.

3.  **Circular Dependency:**
    - _Lỗi:_ `Nest can't resolve dependencies of the [Service]...`.
    - _Fix:_ Dùng `forwardRef(() => Module)` hoặc refactor tách module.
