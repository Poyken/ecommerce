# Quality Control Report: Global Rules

> **Date:** 2026-01-15
> **Status:** PASSED (with minor adjustments)

| Rule                          | Status               | Evidence                                 | Violation (Kẻ phản bội)                         | Note                                                                                                          |
| :---------------------------- | :------------------- | :--------------------------------------- | :---------------------------------------------- | :------------------------------------------------------------------------------------------------------------ |
| **File Naming (kebab-case)**  | ✅ **100% VERIFIED** | `products.controller.ts`, `login.dto.ts` | None found                                      | Consistent across 50+ files scanned.                                                                          |
| **Class Naming (PascalCase)** | ✅ **100% VERIFIED** | `OrdersService`, `LoginDto`              | None found                                      | No lowercase classes found.                                                                                   |
| **Module Structure**          | ✅ **100% VERIFIED** | `src/products`, `src/orders`             | None found                                      | Standard bundle (Controller, Service, Module, DTO) is ubiquitous.                                             |
| **No `any` Usage**            | ⚠️ **MAJOR TREND**   | Most business logic                      | `transform.interceptor.ts`, `orders.service.ts` | Used in Infrastructure (Generic Interceptors) and complex Prisma updates. **Action:** Relax rule description. |
| **Interface vs Type**         | ✅ **100% VERIFIED** | `interface Response<T>`                  | None found                                      | Interfaces used for Shapes, Types used for Utilities (`AppConfig`).                                           |
| **Named Exports**             | ✅ **100% VERIFIED** | `export class`, `export const`           | None found                                      | No `export default` found in codebase.                                                                        |
| **Error Handing**             | ✅ **100% VERIFIED** | `throw new BadRequestException`          | None found                                      | logic uses NestJS Exceptions, not generic Errors.                                                             |

## Action Items

1.  **Update `global.md`:** Clarify that `any` is permitted in Core/Infrastructure layers but forbidden in Business Logic.
