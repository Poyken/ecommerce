---
trigger: always_on
description: Bộ quy tắc CLEAR Framework để viết prompt hiệu quả cho AI.
---

# Prompting Rules (CLEAR Framework)

Bộ quy tắc để viết prompt hiệu quả khi làm việc với AI Agent.

---

## CLEAR Framework

Mỗi prompt nên tuân theo công thức **CLEAR**:

| Letter | Element  | Mô tả                                                |
| ------ | -------- | ---------------------------------------------------- |
| **C**  | Context  | Cung cấp bối cảnh dự án, tech stack, constraints     |
| **L**  | Limit    | Giới hạn phạm vi (chỉ làm X, không làm Y)            |
| **E**  | Examples | Đưa ví dụ mẫu về kết quả mong muốn                   |
| **A**  | Action   | Chỉ rõ hành động cần thực hiện                       |
| **R**  | Review   | Yêu cầu xác nhận hoặc giải thích trước khi thực hiện |

---

## Ví dụ Áp Dụng

### ❌ Prompt kém:

```
Thêm tính năng login
```

### ✅ Prompt CLEAR:

```
**Context**: Dự án Next.js 16 + NestJS, dùng JWT authentication.
Đã có Prisma User model và bcrypt.

**Limit**: Chỉ làm backend API, không làm UI.
Không thay đổi schema.prisma.

**Examples**:
- POST /auth/login { email, password } → { accessToken, refreshToken }
- Error format: { error: string, code: string }

**Action**: Tạo LoginUseCase trong auth module với Zod validation.

**Review**: Liệt kê các files sẽ tạo/sửa trước khi code.
```

---

## Prompt Patterns cho Dev

### 1. Feature Implementation

```
Implement [feature name] for [module].
Tech: [stack].
Requirements:
- [requirement 1]
- [requirement 2]
Follow existing patterns in [reference file].
```

### 2. Debugging

```
Bug: [mô tả bug]
Expected: [kết quả mong đợi]
Actual: [kết quả thực tế]
Relevant files: [file paths]
Help me find root cause and fix.
```

### 3. Refactoring

```
Refactor [file/function] to:
- [improvement 1]
- [improvement 2]
Keep backward compatibility.
Show before/after comparison.
```

### 4. Code Review

```
Review this code for:
- Performance issues
- Security vulnerabilities
- Best practices violations
Suggest improvements with priority (High/Medium/Low).
```

---

## Anti-Patterns (Tránh)

| ❌ Tránh             | ✅ Thay bằng                                      |
| -------------------- | ------------------------------------------------- |
| "Làm cho nó tốt hơn" | "Giảm re-renders bằng useMemo"                    |
| "Sửa bug"            | "Sửa lỗi null check ở line 45"                    |
| "Thêm tests"         | "Thêm unit test cho createOrder với mock payment" |
| "Optimize"           | "Giảm bundle size bằng dynamic imports"           |

---

## Role Assignment

Gán vai trò cho AI để có kết quả tốt hơn:

```
Bạn là Senior Backend Engineer với 10 năm kinh nghiệm NestJS.
Bạn là Security Expert đang audit code.
Bạn là Performance Engineer đang optimize app.
```
