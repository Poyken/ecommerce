---
description: CI/CD pipeline với GitHub Actions cho automated testing và deployment
---

# CI/CD với GitHub Actions

> **Goal**: Automated testing + deployment on every push  
> **Stack**: GitHub Actions → Test → Deploy to Render/Vercel

---

## Workflow Overview

```
git push → GitHub Actions
  ├─ API Tests (Jest + E2E)
  ├─ Web Tests (Vitest + Playwright)
  ├─ Lint & Type Check
  └─ Deploy
      ├─ API → Render (trigger webhook)
      └─ Web → Vercel (auto-deploy)
```

---

## 1. API CI/CD Workflow

Tạo `.github/workflows/api-ci-cd.yml`:

```yaml
name: API CI/CD

on:
  push:
    branches: [main, develop]
    paths:
      - 'api/**'
      - '.github/workflows/api-ci-cd.yml'
  pull_request:
    branches: [main, develop]
    paths:
      - 'api/**'

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          cache-dependency-path: api/pnpm-lock.yaml

      - name: Install dependencies
        run: cd api && pnpm install --frozen-lockfile

      - name: Generate Prisma Client
        run: cd api && npx prisma generate

      - name: Run database migrations
        run: cd api && npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Lint
        run: cd api && pnpm run lint

      - name: Type Check
        run: cd api && npx tsc --noEmit

      - name: Unit Tests
        run: cd api && pnpm run test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379
          JWT_ACCESS_SECRET: test-secret
          JWT_REFRESH_SECRET: test-secret-refresh

      - name: E2E Tests
        run: cd api && pnpm run test:e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379
          JWT_ACCESS_SECRET: test-secret
          JWT_REFRESH_SECRET: test-secret-refresh

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest

    steps:
      - name: Trigger Render Deploy
        run: |
          curl -X POST \
            "${{ secrets.RENDER_DEPLOY_HOOK_API }}"

      - name: Trigger Render Worker Deploy
        run: |
          curl -X POST \
            "${{ secrets.RENDER_DEPLOY_HOOK_WORKER }}"
```

### Setup Render Deploy Hooks

1. Vào Render service → **Settings** → **Deploy Hook**
2. Copy webhook URL
3. GitHub repo → **Settings** → **Secrets and variables** → **Actions**
4. Add secrets:
   - `RENDER_DEPLOY_HOOK_API`: Webhook URL cho API service
   - `RENDER_DEPLOY_HOOK_WORKER`: Webhook URL cho Worker service

---

## 2. Web CI/CD Workflow

Tạo `.github/workflows/web-ci-cd.yml`:

```yaml
name: Web CI/CD

on:
  push:
    branches: [main, develop]
    paths:
      - 'web/**'
      - '.github/workflows/web-ci-cd.yml'
  pull_request:
    branches: [main, develop]
    paths:
      - 'web/**'

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          cache-dependency-path: web/pnpm-lock.yaml

      - name: Install dependencies
        run: cd web && pnpm install --frozen-lockfile

      - name: Lint
        run: cd web && pnpm run lint

      - name: Type Check
        run: cd web && npx tsc --noEmit

      - name: Unit Tests
        run: cd web && pnpm run test:run

      - name: Build
        run: cd web && pnpm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}

      - name: E2E Tests
        run: cd web && pnpm run test:e2e
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: web/playwright-report/
          retention-days: 30

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest

    steps:
      - name: Trigger Vercel Deploy
        run: |
          # Vercel auto-deploys on git push, no action needed
          echo "Vercel will auto-deploy from main branch"
```

### Vercel Auto-Deploy

Vercel tự động deploy khi:

- Push lên `main` branch
- GitHub integration đã connect

Không cần webhook, Vercel tự động detect git push.

---

## 3. Monorepo Optimizations

### Cache Dependencies

```yaml
- uses: actions/cache@v3
  with:
    path: |
      ~/.pnpm-store
      node_modules
      api/node_modules
      web/node_modules
    key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
```

### Conditional Jobs

```yaml
jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      api: ${{ steps.filter.outputs.api }}
      web: ${{ steps.filter.outputs.web }}
    steps:
      - uses: dorny/paths-filter@v2
        id: filter
        with:
          filters: |
            api:
              - 'api/**'
            web:
              - 'web/**'

  test-api:
    needs: changes
    if: ${{ needs.changes.outputs.api == 'true' }}
    # ... test API only if changed

  test-web:
    needs: changes
    if: ${{ needs.changes.outputs.web == 'true' }}
    # ... test Web only if changed
```

---

## 4. Pull Request Checks

### Required Status Checks

GitHub repo → **Settings** → **Branches** → **Branch protection rules** for `main`:

✅ Require status checks to pass:

- API Tests
- Web Tests
- Lint
- Type Check

✅ Require branches to be up to date

---

## 5. Deploy Notifications

### Slack Integration

```yaml
- name: Notify Slack on Deploy
  if: success()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "🚀 Deployed to production",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Deployment Successful*\nCommit: ${{ github.sha }}\nAuthor: ${{ github.actor }}"
            }
          }
        ]
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## 6. Rollback on Failure

```yaml
deploy:
  steps:
    - name: Deploy to Render
      id: deploy
      run: curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK_API }}"

    - name: Wait for deployment
      run: sleep 60

    - name: Health Check
      id: health
      run: |
        response=$(curl -s -o /dev/null -w "%{http_code}" https://ecommerce-api.onrender.com/health)
        if [ $response != "200" ]; then
          echo "Health check failed!"
          exit 1
        fi

    - name: Rollback on failure
      if: failure()
      run: |
        # Trigger previous deployment
        echo "Rolling back..."
        # Manual rollback via Render dashboard or API
```

---

## 7. Environment-Specific Workflows

### Staging (develop branch)

```yaml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Render Staging
        run: curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK_STAGING }}"
```

### Production (main branch)

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

  # Manual trigger
  workflow_dispatch:

jobs:
  deploy-production:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to Render Production
        run: curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK_PROD }}"
```

---

## 8. Secrets Management

### Required Secrets

GitHub repo → **Settings** → **Secrets and variables** → **Actions**:

| Secret                      | Purpose               | Example                                     |
| --------------------------- | --------------------- | ------------------------------------------- |
| `RENDER_DEPLOY_HOOK_API`    | API deploy webhook    | `https://api.render.com/deploy/srv-xxx`     |
| `RENDER_DEPLOY_HOOK_WORKER` | Worker deploy webhook | `https://api.render.com/deploy/srv-yyy`     |
| `NEXT_PUBLIC_API_URL`       | API URL for Web build | `https://ecommerce-api.onrender.com/api/v1` |
| `SLACK_WEBHOOK_URL`         | Slack notifications   | `https://hooks.slack.com/services/xxx`      |

---

## 9. Badge in README

Add build status badge:

```markdown
[![API CI/CD](https://github.com/user/repo/actions/workflows/api-ci-cd.yml/badge.svg)](https://github.com/user/repo/actions/workflows/api-ci-cd.yml)
[![Web CI/CD](https://github.com/user/repo/actions/workflows/web-ci-cd.yml/badge.svg)](https://github.com/user/repo/actions/workflows/web-ci-cd.yml)
```

---

## 10. Best Practices

### DO

- ✅ Run tests on every PR
- ✅ Block merge if tests fail
- ✅ Deploy only from `main` branch
- ✅ Use environment protection rules
- ✅ Cache dependencies
- ✅ Notify team on deploy

### DON'T

- ❌ Skip tests to "save time"
- ❌ Deploy without approval (use workflow_dispatch)
- ❌ Store secrets in code
- ❌ Run expensive tests on every commit (use paths filter)

---

**Location**: `.github/workflows/`
