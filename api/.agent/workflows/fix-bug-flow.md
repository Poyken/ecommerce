# Workflow: Fix Bug (Chuẩn Project)

> **Context:** NestJS + Prisma + Jest + Winston Logger.

## Bước 1: Reproduce & Document (Tái hiện lỗi)

Trước khi sửa, phải chắc chắn lỗi tồn tại và hiểu rõ nó.

1.  **Locate Log:**
    - Dev: Check terminal output (màu sắc).
    - Prod: Check file `logs/error.log` hoặc `logs/combined.log` (JSON format).
2.  **Steps to Reproduce:**
    Ghi lại input cụ thể gây lỗi (Ví dụ: JSON Body, Params).

## Bước 2: Viết Failing Test (TDD - Optional but Recommended)

Tạo file `*.spec.ts` ngay cạnh file bị lỗi (Co-location).

```typescript
// sample.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { SampleService } from './sample.service';

describe('SampleService: Bug Fix #123', () => {
  let service: SampleService;

  beforeEach(async () => {
    // Setup Mock
  });

  it('should handle edge case X correctly', async () => {
    // 1. Arrange
    const input = { ... }; // Input gây lỗi

    // 2. Act & Assert
    await expect(service.method(input)).rejects.toThrow('Expected Error');
    // Hoặc
    // expect(result).toEqual(expectedValue);
  });
});
```

Chạy test để _nhìn thấy nó fail_:

```bash
npm run test -- src/path/to/file.spec.ts
```

## Bước 3: Debug & Fix

1.  **Logging:**
    Sử dụng `LoggerService` của project (Winston wrapped), hạn chế `console.log`.
    ```typescript
    this.logger.debug('Validation failed', { input, reason: '...' });
    ```
2.  **Breakpoints:**
    Dùng VSCode Debugger: Attach to Process (nếu chạy `start:debug`) hoặc Javascript Debug Terminal.
3.  **Database Inspection:**
    Dùng Prisma Studio để xem dữ liệu thật:
    ```bash
    npx prisma studio
    ```

## Bước 4: Verify Fix

1.  **Chạy lại Unit Test:**

    ```bash
    npm run test -- src/path/to/file.spec.ts
    ```

    _Expectation:_ Test chuyển từ ❌ **FAIL** sang ✅ **PASS**.

2.  **Lint Check:**
    Đảm bảo không để lại code rác.

    ```bash
    npm run lint
    ```

3.  **Smoke Test:**
    Gọi lại API bằng Postman/Curl để đảm bảo E2E hoạt động.

## Bước 5: Commit

Sử dụng Conventional Commits để ghi nhận:

```bash
git add .
git commit -m "fix(module-name): [mô tả ngắn gọn lỗi đã sửa]"

# Trong body message ghi rõ:
# - Root Cause: Tại sao lỗi xảy ra? (VD: Thiếu check null)
# - Solution: Cách sửa? (VD: Thêm Guard Clause)
# - Ticket: Closes #123
```
