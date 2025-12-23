# 🚀 Deployment Guide - Render.com

This project is configured for automated deployment to [Render](https://render.com) using a **Blueprint (render.yaml)**. This ensures all services (Database, Redis, API, and Web) are provisioned with the correct settings.

## 📋 Prerequisites

- A **Render.com** account.
- Your project pushed to a **GitHub** or **GitLab** repository.

## 🛠️ Step-by-Step Deployment

### 1. Initial Blueprint Setup

1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** and select **Blueprint**.
3. Connect your project repository.
4. Render will detect the `render.yaml` file and show you the services it will create:
   - **ecommerce-db** (PostgreSQL)
   - **ecommerce-redis** (Redis)
   - **ecommerce-api** (Web Service - NestJS)
   - **ecommerce-web** (Web Service - Next.js)
5. Click **Apply**.

### 2. Post-Deployment Configuration

After Render starts the deployment, you will need to update two critical environment variables once the public URLs are assigned:

#### Update `ecommerce-api`:

1. Go to the `ecommerce-api` service settings.
2. Find `FRONTEND_URL` and update it to your actual **Web** service URL (e.g., `https://ecommerce-web.onrender.com`).

#### Update `ecommerce-web`:

1. Go to the `ecommerce-web` service settings.
2. Find `NEXT_PUBLIC_API_URL` and update it to your actual **API** service URL (e.g., `https://ecommerce-api.onrender.com/api/v1`).
3. **Important:** Trigger a new build for `ecommerce-web` so the client-side code picks up the correct API URL.

### 3. Database Seeding (Optional)

On the first deployment, your database will be empty. You can seed it by running a manual command in the `ecommerce-api` **Shell** tab:

```bash
npm run seed:all
```

This will populate the database with categories, brands, products, and initial blog posts.

## ⚙️ Environment Variables Summary

### API Service (`ecommerce-api`)

- `DATABASE_URL`: Automatically linked.
- `REDIS_URL`: Automatically linked.
- `JWT_ACCESS_SECRET`: Generated automatically.
- `JWT_REFRESH_SECRET`: Generated automatically.
- `FRONTEND_URL`: URL of your Web service.

### Web Service (`ecommerce-web`)

- `API_URL`: Internal URL for server-to-server communication (`http://ecommerce-api:10000/api/v1`).
- `NEXT_PUBLIC_API_URL`: Public URL for browser-to-server communication.

## 🔍 Troubleshooting

- **Build Errors:** Ensure you have pushed all recent fixes, especially the TypeScript and environment variable handling fixes.
- **Connection Issues:** Verify that `API_URL` in the Web service points to the internal Render service name (`ecommerce-api`).
