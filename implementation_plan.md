# Implementation Plan: Full Project E2E Verification

This plan outlines the steps to start the infrastructure, launch the API, and execute the complete suite of business flow tests.

## 1. Environment Preparation

- [x] Check `docker-compose.yml` and `.env` consistency (Verified).
- [!] Start Docker infrastructure (FAILED: Docker Desktop Service is Stopped).
- [ ] Verify connectivity to DB (5433) and Redis (6380).
      _Note: Access to Docker is currently blocked on the host system._

## 2. API Service Startup

- [x] Start API in watch mode (`npm run dev`) - Attempted, but hanging due to DB unavailability.
- [ ] Monitor logs until "Nest application successfully started".
- [ ] Use `check-health.ts` to confirm API availability.

## 3. Test Execution (The "Master Runner")

- [ ] Execute `test/run-all-e2e.ts` which performs:
  - **Step 3.1: Seed Data**: Initialize default tenants and products.
  - **Step 3.2: B2B2C Full Flow**: Test multi-party business logic.
  - **Step 3.3: SaaS Onboarding Flow**: Test tenant registration and subscription.
  - **Step 3.4: Tenant Purchase Flow**: Test storefront buying experience.
  - **Step 3.5: Legacy Happy Path**: Final sanity check.

## 4. Final Review & Documentation

- [ ] Capture test outputs.
- [ ] Update `CONTEXT.md` with results.
- [ ] Report status: B2B PASS, B2C PASS, B2B2C PASS.
