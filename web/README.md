# Luxe Web Application

This is the Next.js frontend for the Luxe E-Commerce platform.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Environment Variables

Copy `.env.example` to `.env` (or create `.env`) and configure the following:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:8080
```

### Installation

```bash
npm install
# or
pnpm install
```

### Running Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🏗 Architecture

This project follows a **Feature-based Architecture**:

- `@/app`: Next.js App Router (Pages & Layouts).
- `@/features`: Business logic grouped by domain (e.g., `products`, `cart`, `auth`).
  - `components`: Feature-specific UI.
  - `services`: API calls.
  - `store`: State management (Zustand).
  - `hooks`: React hooks.
- `@/components`: Shared generic components (Buttons, Inputs, etc.) - mostly Shadcn UI.
- `@/lib`: Shared utilities and centralized configuration (`env.ts`).

## 🛠 Code Standards

- **Linting**: strict ESLint rules are enforced. Run `npm run lint` to check.
- **Type Safety**: TypeScript is used strictly (`noEmit` check in CI).
- **Configuration**: All environment variables are accessed via `@/lib/env.ts` to ensure type safety and fail-fast behavior.
- **Components**: Prefer composition over inheritance. Use "Smart/Dumb" component pattern where complex.

## 📦 Scripts

- `npm run dev`: Start dev server.
- `npm run build`: Build for production.
- `npm run lint`: Run ESLint.
- `npm test`: Run Vitest (Unit Tests).
