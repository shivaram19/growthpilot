<div align="center">

# 🚀 GrowthPilot

### AI-Powered Growth Automation for Shopify + Meta Ads

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)](https://typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma)](https://prisma.io/)
[![Tests](https://img.shields.io/badge/Tests-60%20passing-brightgreen)]()
[![License](https://img.shields.io/badge/License-MIT-green)]()

**Connect your Shopify store → Sync products & orders → Run AI-optimized Meta Ads → Watch revenue grow**

[Quick Start](#-quick-start) · [Architecture](#-architecture) · [API Reference](#-api-reference) · [Testing](#-testing) · [Deployment](#-deployment)

</div>

---

## 📋 What is GrowthPilot?

GrowthPilot is a full-stack platform that connects your **Shopify store** with **Meta (Facebook/Instagram) Ads** and uses **AI** to automate growth decisions — ad copy generation, audience targeting, budget optimization, and anomaly detection.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│    Shopify Store ──sync──▶ GrowthPilot ──optimize──▶ Meta Ads   │
│         │                      │                        │       │
│    Products                 AI Engine               Campaigns   │
│    Orders               (GPT-4o-mini)              Ad Sets      │
│    Customers         Budget Optimization           Audiences    │
│                     Anomaly Detection               Insights    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Features

| Feature | Description |
|---------|-------------|
| 🛍 **Shopify Sync** | Real-time product, order & customer sync with webhook support |
| 📢 **Meta Ads Management** | Create campaigns, ad sets, audiences via Meta Marketing API |
| 🤖 **AI Ad Copy** | GPT-4o-mini generates headlines, primary text, CTAs with tone control |
| 🎯 **Audience Suggestions** | AI analyzes store data to discover untapped customer segments |
| 💰 **Budget Optimization** | Automatically reallocates spend across campaigns for max ROAS |
| 🚨 **Anomaly Detection** | Detects CPA spikes, ROAS drops, creative fatigue in real-time |
| 📊 **Analytics Dashboard** | Revenue, ROAS, orders, CTR, CPC — with period comparisons |
| ⚡ **Automation Rules** | Trigger actions on ROAS drop, budget threshold, inventory low |

---

## 🧰 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 15 (App Router + Turbopack) | React server components, API routes |
| **Auth** | Clerk | Multi-tenant orgs, OAuth, session management |
| **Database** | PostgreSQL 16 + Prisma ORM | 21 models, type-safe queries |
| **Validation** | Zod | Runtime schema validation for all API inputs |
| **AI** | OpenAI GPT-4o-mini | Ad copy, audience suggestions, budget optimization |
| **Styling** | Tailwind CSS | Custom dark design system |
| **Testing** | Vitest + Testing Library | 60 unit tests across 6 suites |
| **Monorepo** | Turborepo + npm workspaces | Shared packages, parallel builds |
| **Deployment** | Docker + Railway | Multi-stage builds, health checks |

---

## ⚡ Quick Start

### Prerequisites

| Tool | Version | Check | Install (Mac) |
|------|---------|-------|---------------|
| **Node.js** | ≥ 20 | `node -v` | `brew install node@20` |
| **Docker** | Latest | `docker --version` | `brew install --cask docker` |
| **Git** | Any | `git --version` | `brew install git` |

---

### Option A: Automated Setup (Recommended)

```bash
# Clone the repo
git clone <your-repo-url> growthpilot
cd growthpilot

# Run the setup script — handles everything
chmod +x start.sh
./start.sh
```

The script walks through **12 steps** with color-coded output:

```
 ✔ Node.js v24.11.1 (≥20 ✓)          ← Prerequisites check
 ✔ Docker 29.2.1 (running)
 ✔ Created .env with random CRON_SECRET ← Environment config
 ✔ PostgreSQL container started         ← Database setup
 ✔ All dependencies installed           ← npm install
 ✔ Prisma client generated (20+ models) ← ORM codegen
 ✔ All database tables created          ← Schema push
 ✔ 60 passed (60)                       ← Full test suite
 ✔ Ready in 2.1s                        ← Dev server live
```

---

### Option B: Manual Setup (Step by Step)

#### Step 1 — Clone & Install

```bash
git clone <your-repo-url> growthpilot
cd growthpilot
npm install
```

> **What happens:** npm resolves 3 workspaces — `apps/web`, `packages/database`, `packages/shared` — and installs all dependencies including Next.js, Prisma, Vitest, Zod, Clerk SDK, and OpenAI SDK.

#### Step 2 — Configure Environment

```bash
cp .env.example .env
```

Open `.env` in your editor and fill in API keys (see [Configuration](#-configuration) below).

#### Step 3 — Start PostgreSQL

```bash
# Start Postgres via Docker
docker compose -f docker/docker-compose.yml up -d db

# Verify it's running
docker ps
```

> **Port 5432 already in use?** See [Port Conflicts](#port-conflicts) section.

#### Step 4 — Generate Prisma Client

```bash
npx prisma generate --schema=packages/database/prisma/schema.prisma
```

> **What happens:** Prisma reads the schema (21 models, 9 enums) and generates a fully typed TypeScript client in `node_modules/.prisma/client`.

#### Step 5 — Push Database Schema

```bash
npx prisma db push --schema=packages/database/prisma/schema.prisma
```

> **What happens:** Creates all 21 tables in PostgreSQL — Organization, Product, Order, MetaAdCampaign, AIInsight, etc.

#### Step 6 — Run Tests (Optional)

```bash
npm test
```

> Expected output: `Tests 60 passed (60)` across 6 test suites.

#### Step 7 — Start Development Server

```bash
npm run dev
```

> **What happens:** Next.js 15 starts with Turbopack on port 3000. Compiles middleware, mounts all API routes, and serves the React app.

---

### 🌐 Open in Browser

Once the dev server is running, you'll have access to:

| URL | What You'll See |
|-----|----------------|
| [localhost:3000](http://localhost:3000) | 🏠 Marketing landing page |
| [localhost:3000/sign-in](http://localhost:3000/sign-in) | 🔑 Clerk authentication (sign up / sign in) |
| [localhost:3000/dashboard](http://localhost:3000/dashboard) | 📊 Dashboard with metrics, charts, AI insights |
| [localhost:3000/api/health](http://localhost:3000/api/health) | ❤️ `{"status":"ok","timestamp":"..."}` |

---

## 🔑 Configuration

### 🔗 Quick Reference — Where to Get Every Token

| Token | Get it from | Required? |
|-------|-------------|-----------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | [dashboard.clerk.com](https://dashboard.clerk.com) → API Keys | ✅ Yes |
| `CLERK_SECRET_KEY` | [dashboard.clerk.com](https://dashboard.clerk.com) → API Keys | ✅ Yes |
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | ✅ Yes (for AI) |
| `SHOPIFY_API_KEY` | [partners.shopify.com/organizations](https://partners.shopify.com/organizations) → Apps | ⬜ Optional |
| `SHOPIFY_API_SECRET` | [partners.shopify.com/organizations](https://partners.shopify.com/organizations) → Apps | ⬜ Optional |
| `SHOPIFY_WEBHOOK_SECRET` | [partners.shopify.com/organizations](https://partners.shopify.com/organizations) → Apps → Webhooks | ⬜ Optional |
| `META_APP_ID` | [developers.facebook.com/apps](https://developers.facebook.com/apps) → Settings → Basic | ⬜ Optional |
| `META_APP_SECRET` | [developers.facebook.com/apps](https://developers.facebook.com/apps) → Settings → Basic | ⬜ Optional |

---

### Step-by-Step: Get Each Token

<details>
<summary><strong>1. 🔐 Clerk (Authentication) — Required</strong></summary>

#### Create Account & Application

1. Open **[https://clerk.com/sign-up](https://clerk.com/sign-up)** → Create a free account
2. After sign-up, you'll land on the dashboard. If not, go to **[https://dashboard.clerk.com](https://dashboard.clerk.com)**
3. Click **"Create application"**
4. Name it `GrowthPilot` (or anything you like)
5. Under **Sign-in options**, check: `Email`, `Google`, `GitHub` (pick what you want)
6. Click **"Create application"**

#### Copy API Keys

7. You'll be taken to the **Quickstart** page — skip it
8. In the left sidebar, click **"API Keys"**
   - Direct link: **[https://dashboard.clerk.com/last-active?path=api-keys](https://dashboard.clerk.com/last-active?path=api-keys)**
9. You'll see two keys:
   - **Publishable key** — starts with `pk_test_`
   - **Secret key** — click "eye" icon to reveal, starts with `sk_test_`
10. Copy both into your `.env`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> ⚠️ **Without these keys**, the app will crash on `/dashboard` with an auth redirect error.

</details>

<details>
<summary><strong>2. 🤖 OpenAI (AI Features) — Required for AI</strong></summary>

#### Create Account

1. Open **[https://platform.openai.com/signup](https://platform.openai.com/signup)** → Sign up (or sign in)
2. You may need to add a payment method at **[https://platform.openai.com/settings/organization/billing/overview](https://platform.openai.com/settings/organization/billing/overview)**
   - GrowthPilot uses `gpt-4o-mini` which costs ~$0.15 per 1M input tokens (very cheap)

#### Create API Key

3. Go to **[https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)**
4. Click **"Create new secret key"**
5. Name it `GrowthPilot`
6. Click **"Create secret key"**
7. **Copy it immediately** — you won't be able to see it again
8. Paste into `.env`:

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> 💡 Without this key, all other features (Shopify sync, dashboard, campaigns) still work — only the `/api/ai/generate` endpoint requires it.

</details>

<details>
<summary><strong>3. 🛍 Shopify (Store Integration) — Optional</strong></summary>

#### Create Partner Account & App

1. Open **[https://partners.shopify.com/signup](https://partners.shopify.com/signup)** → Create a free Partner account
2. After sign-up, go to **[https://partners.shopify.com/organizations](https://partners.shopify.com/organizations)**
3. Select your organization (or create one)
4. In the left sidebar, click **"Apps"**
   - Direct: **[https://partners.shopify.com/current/apps](https://partners.shopify.com/current/apps)**
5. Click **"Create app"** → Choose **"Create app manually"**
6. Name it `GrowthPilot`, set the App URL to `http://localhost:3000`
7. Click **"Create"**

#### Get API Credentials

8. On the app page, click **"Client credentials"** tab
9. You'll see:
   - **Client ID** → this is your `SHOPIFY_API_KEY`
   - **Client secret** → click "Show" → this is your `SHOPIFY_API_SECRET`
10. For webhooks, go to **"App setup"** → scroll to **"Event subscriptions"**
    - Your webhook signing secret is the `SHOPIFY_WEBHOOK_SECRET`

```env
SHOPIFY_API_KEY=your_client_id_here
SHOPIFY_API_SECRET=your_client_secret_here
SHOPIFY_WEBHOOK_SECRET=your_webhook_signing_secret
```

#### Create a Development Store (for testing)

11. Back in Partners dashboard → **"Stores"** in the left sidebar
    - Direct: **[https://partners.shopify.com/current/stores](https://partners.shopify.com/current/stores)**
12. Click **"Add store"** → **"Create development store"**
13. Choose **"Create a store to test and build"**
14. Fill in store name → Click **"Create"**
15. In your dev store, go to **Settings → Apps and sales channels → Develop apps**
16. Click **"Create an app"** → Name it → **"Create app"**
17. Go to **"Configuration"** tab → Under **Admin API access scopes**, select:
    - `read_products`, `write_products`
    - `read_orders`, `write_orders`
    - `read_customers`
18. Click **"Save"** → then go to **"API credentials"** tab
19. Click **"Install app"** → **"Install"**
20. Copy the **Admin API access token** (starts with `shpat_`) — this is what you'll use when connecting the store via the GrowthPilot UI

> 🔑 The `shpat_` access token is entered through the GrowthPilot dashboard when you connect a store, NOT in `.env`. The `.env` keys are for the app-level OAuth credentials.

</details>

<details>
<summary><strong>4. 📢 Meta / Facebook (Ads Integration) — Optional</strong></summary>

#### Create Developer Account & App

1. Open **[https://developers.facebook.com](https://developers.facebook.com)** → Log in with your Facebook account
2. If first time, click **"Get Started"** → agree to terms → verify your account
3. Go to **[https://developers.facebook.com/apps/create/](https://developers.facebook.com/apps/create/)**
4. Select use case → **"Other"** → Click **"Next"**
5. Select app type → **"Business"** → Click **"Next"**
6. Name it `GrowthPilot`, enter your email → Click **"Create app"**

#### Get App Credentials

7. In the app dashboard left sidebar, click **"App settings"** → **"Basic"**
   - Direct: **[https://developers.facebook.com/apps/{YOUR_APP_ID}/settings/basic/](https://developers.facebook.com/apps/)**
8. You'll see:
   - **App ID** → this is your `META_APP_ID`
   - **App secret** → click **"Show"**, enter password → this is your `META_APP_SECRET`

```env
META_APP_ID=123456789012345
META_APP_SECRET=abcdef1234567890abcdef1234567890
```

#### Enable Marketing API

9. In the left sidebar → **"Add products"** (or **"Products +"**)
10. Find **"Marketing API"** → Click **"Set up"**
11. This gives your app access to create campaigns, ad sets, and audiences

#### Get an Access Token (for testing)

12. Go to **[https://developers.facebook.com/tools/explorer/](https://developers.facebook.com/tools/explorer/)**
    - This is the **Graph API Explorer**
13. In the top-right dropdown, select your `GrowthPilot` app
14. Click **"Generate Access Token"**
15. Grant permissions when prompted:
    - `ads_management`
    - `ads_read`
    - `business_management`
16. Copy the generated token — this is what you'll use when connecting a Meta ad account through the GrowthPilot UI

#### Find Your Ad Account ID

17. Go to **[https://business.facebook.com/settings/ad-accounts](https://business.facebook.com/settings/ad-accounts)**
18. Select your ad account
19. The **Ad Account ID** is shown (format: `act_123456789`)
20. You'll enter this in GrowthPilot when connecting Meta Ads

> 💡 The access token from Graph API Explorer expires in ~1 hour. For production, you'll need a [System User Token](https://developers.facebook.com/docs/marketing-api/overview/authorization#system-user-access-tokens) which doesn't expire.

</details>

### Full `.env` Reference

```env
# ─── Database (auto-configured if using Docker) ────────────
DATABASE_URL="postgresql://growthpilot:growthpilot_dev@localhost:5432/growthpilot"
REDIS_URL="redis://localhost:6379"

# ─── Auth (required) ───────────────────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/onboarding"

# ─── AI (required for AI features) ─────────────────────────
OPENAI_API_KEY="sk-..."

# ─── Shopify (optional) ────────────────────────────────────
SHOPIFY_API_KEY="..."
SHOPIFY_API_SECRET="..."
SHOPIFY_WEBHOOK_SECRET="..."

# ─── Meta Ads (optional) ───────────────────────────────────
META_APP_ID="..."
META_APP_SECRET="..."

# ─── App ────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"
CRON_SECRET="auto-generated-by-start-script"
```

---

## 🏗 Architecture

### Project Structure

```
growthpilot/
│
├── apps/web/                          ← Next.js 15 Application
│   ├── app/
│   │   ├── page.tsx                   ← Landing page
│   │   ├── layout.tsx                 ← Root layout + Clerk provider
│   │   ├── globals.css                ← Dark design system (Tailwind)
│   │   │
│   │   ├── dashboard/
│   │   │   ├── layout.tsx             ← Sidebar (8 nav items)
│   │   │   └── page.tsx               ← Metrics, charts, AI insights
│   │   │
│   │   └── api/
│   │       ├── health/route.ts        ← GET  /api/health
│   │       ├── shopify/
│   │       │   ├── connect/route.ts   ← POST/GET  /api/shopify/connect
│   │       │   └── sync/route.ts      ← POST      /api/shopify/sync
│   │       ├── meta/
│   │       │   └── connect/route.ts   ← POST/GET  /api/meta/connect
│   │       ├── campaigns/route.ts     ← GET/POST   /api/campaigns
│   │       ├── analytics/route.ts     ← GET        /api/analytics
│   │       ├── ai/
│   │       │   └── generate/route.ts  ← POST       /api/ai/generate
│   │       ├── webhooks/
│   │       │   └── shopify/route.ts   ← POST       /api/webhooks/shopify
│   │       └── cron/route.ts          ← GET        /api/cron
│   │
│   ├── lib/                           ← Core business logic
│   │   ├── shopify/service.ts         ← Shopify Admin API client
│   │   ├── meta/service.ts            ← Meta Marketing API client
│   │   ├── ai/service.ts              ← OpenAI-powered AI engine
│   │   ├── prisma/client.ts           ← Database client singleton
│   │   └── utils/
│   │       ├── auth.ts                ← Clerk auth + API helpers
│   │       └── analytics.ts           ← Metrics aggregation engine
│   │
│   └── __tests__/                     ← 6 test suites, 60 tests
│       ├── setup.ts
│       ├── schemas.test.ts
│       ├── shopify-service.test.ts
│       ├── meta-service.test.ts
│       ├── ai-service.test.ts
│       ├── analytics.test.ts
│       └── api-utils.test.ts
│
├── packages/
│   ├── database/                      ← Prisma ORM package
│   │   ├── prisma/schema.prisma       ← 21 models, 9 enums
│   │   └── src/index.ts               ← Client export
│   │
│   └── shared/                        ← Shared validation & types
│       └── src/index.ts               ← Zod schemas, TS types, plan constants
│
├── docker/
│   ├── Dockerfile                     ← Multi-stage production build
│   └── docker-compose.yml             ← PostgreSQL + Redis
│
├── start.sh                           ← One-command Mac setup (12 steps)
├── turbo.json                         ← Turborepo pipeline
├── railway.toml                       ← Railway deployment config
└── .env.example                       ← Environment variable template
```

### Service Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Next.js API Routes                       │
│  /shopify/*    /meta/*    /ai/*    /campaigns   /analytics   │
└──────┬────────────┬─────────┬──────────┬───────────┬─────────┘
       │            │         │          │           │
       ▼            ▼         ▼          ▼           ▼
┌────────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────────────┐
│  Shopify   │ │  Meta   │ │   AI    │ │   Analytics Service  │
│  Service   │ │ Service │ │ Service │ │                      │
│            │ │         │ │         │ │  getDashboardMetrics  │
│ syncProds  │ │ getCamp │ │ genCopy │ │  getComparisonMetrics │
│ syncOrders │ │ adSets  │ │ suggest │ │                      │
│ syncCust   │ │ insight │ │ optimze │ │                      │
│ webhooks   │ │ audienc │ │ anomaly │ │                      │
└─────┬──────┘ └────┬────┘ └────┬────┘ └──────────┬───────────┘
      │             │           │                  │
      └─────────────┴───────────┴──────────────────┘
                            │
                  ┌─────────▼──────────┐
                  │    Prisma ORM      │
                  │    21 Models       │
                  │    PostgreSQL 16   │
                  └────────────────────┘
```

### Database Schema (21 Models, 9 Enums)

```
Organization ─┬──▶ Member (role: OWNER | ADMIN | MEMBER | VIEWER)
              │
              ├──▶ ShopifyStore
              │      ├──▶ Product
              │      ├──▶ Order ──▶ OrderItem
              │      └──▶ ShopifyCustomer
              │
              ├──▶ MetaAdAccount
              │      └──▶ MetaAdCampaign
              │             └──▶ MetaAdSet
              │                    └──▶ MetaAd ──▶ AdCreative
              │
              ├──▶ Campaign ◀──many-to-many──▶ Audience
              │                (via CampaignAudience)
              │
              ├──▶ AIInsight (type: ANOMALY | RECOMMENDATION | PREDICTION)
              ├──▶ AutomationRule ──▶ AutomationLog
              ├──▶ BudgetAlert
              └──▶ SyncLog

              Order ──▶ AdAttribution (tracks which ad drove which order)
```

---

## 🌐 API Reference

### Authentication

All `/api/*` routes (except `/api/health`, `/api/webhooks/*`, `/api/cron`) require a valid Clerk session. The middleware at `apps/web/middleware.ts` enforces this automatically.

### Route Map

#### System

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/health` | None | Server status check |
| `GET` | `/api/cron` | `Bearer CRON_SECRET` | Scheduled sync for all stores & accounts |

#### Shopify Integration

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/shopify/connect` | Clerk | Connect a Shopify store |
| `GET` | `/api/shopify/connect` | Clerk | List connected stores with counts |
| `POST` | `/api/shopify/sync` | Clerk | Manual product/order/customer sync |
| `POST` | `/api/webhooks/shopify` | HMAC-SHA256 | Receive real-time Shopify events |

<details>
<summary>📝 <strong>POST /api/shopify/connect</strong> — Connect Store</summary>

```bash
curl -X POST http://localhost:3000/api/shopify/connect \
  -H "Content-Type: application/json" \
  -d '{
    "shopDomain": "my-store.myshopify.com",
    "accessToken": "shpat_xxxxxxxxxxxx",
    "scope": "read_products,read_orders,read_customers"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "storeId": "clxyz...",
    "shopDomain": "my-store.myshopify.com"
  }
}
```

What happens behind the scenes:
1. Validates input with `ShopifyConnectSchema`
2. Creates `ShopifyStore` record
3. Triggers background sync: products → orders → customers
4. Registers 8 webhook topics

</details>

<details>
<summary>📝 <strong>POST /api/shopify/sync</strong> — Manual Sync</summary>

```bash
curl -X POST http://localhost:3000/api/shopify/sync \
  -H "Content-Type: application/json" \
  -d '{ "storeId": "clxyz...", "type": "all" }'
```

**Type options:** `"all"` | `"products"` | `"orders"` | `"customers"`

</details>

<details>
<summary>📝 <strong>Webhook Topics Handled</strong></summary>

| Topic | Action |
|-------|--------|
| `orders/create` | Upsert order with line items |
| `orders/updated` | Update order status/totals |
| `products/create` | Create product record |
| `products/update` | Update product details |
| `products/delete` | Remove product |
| `customers/create` | Create customer profile |
| `customers/update` | Update customer data |
| `app/uninstalled` | Deactivate store |

All webhooks are verified with HMAC-SHA256 signature validation.

</details>

#### Meta Ads Integration

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/meta/connect` | Clerk | Connect an ad account |
| `GET` | `/api/meta/connect` | Clerk | List ad accounts with campaign counts |

#### Campaigns

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/campaigns` | Clerk | List campaigns (paginated, filterable) |
| `POST` | `/api/campaigns` | Clerk | Create a new campaign |

<details>
<summary>📝 <strong>GET /api/campaigns</strong> — Query Parameters</summary>

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Items per page (max 100) |
| `sortBy` | string | `createdAt` | Sort field |
| `sortOrder` | string | `desc` | `asc` or `desc` |
| `status` | string | — | Filter by: `DRAFT` `ACTIVE` `PAUSED` `COMPLETED` `ARCHIVED` |

</details>

<details>
<summary>📝 <strong>POST /api/campaigns</strong> — Create Campaign</summary>

```bash
curl -X POST http://localhost:3000/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Q1 Retargeting",
    "type": "RETARGETING",
    "goal": "Recover abandoned carts",
    "budget": 1000,
    "aiOptimized": true,
    "audienceIds": ["aud-1", "aud-2"]
  }'
```

**Campaign types:** `AWARENESS` · `TRAFFIC` · `CONVERSIONS` · `RETARGETING` · `LOOKALIKE` · `DYNAMIC_PRODUCT`

</details>

#### AI Engine

All AI actions go through **one endpoint** with different `action` values:

**`POST /api/ai/generate`**

| Action | What It Does | Key Input |
|--------|-------------|-----------|
| `ad-copy` | Generate headline, text, CTA + 2 variations | `productId`, `tone`, `platform` |
| `suggest-audiences` | Discover 3-5 audience segments | `productIds?` |
| `optimize-budget` | Reallocate spend for max ROAS | `campaignIds`, `totalBudget` |
| `detect-anomalies` | Find CPA spikes, ROAS drops, fatigue | — (analyzes all active campaigns) |
| `score-products` | Composite 0-10 performance score | `storeId` |

<details>
<summary>📝 <strong>Ad Copy Generation</strong></summary>

```bash
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "action": "ad-copy",
    "productId": "prod-123",
    "tone": "playful",
    "platform": "meta_story",
    "targetAudience": "Women 25-45",
    "includeEmoji": true
  }'
```

**Tones:** `professional` · `casual` · `urgent` · `playful` · `luxurious`

**Platforms:** `meta_feed` · `meta_story` · `meta_reel`

**Response includes:** headline, primaryText, description, callToAction, plus 2 variations

</details>

<details>
<summary>📝 <strong>Budget Optimization</strong></summary>

```bash
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "action": "optimize-budget",
    "campaignIds": ["camp-1", "camp-2", "camp-3"],
    "totalBudget": 5000,
    "optimizeFor": "roas"
  }'
```

**Optimize for:** `roas` · `conversions` · `cpa`

Returns per-campaign allocations with reasoning and expected impact.

</details>

#### Analytics

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/analytics` | Clerk | Dashboard metrics |
| `GET` | `/api/analytics?compare=true&period=month` | Clerk | Period-over-period comparison |

<details>
<summary>📝 <strong>Analytics Response Shape</strong></summary>

```json
{
  "success": true,
  "data": {
    "totalRevenue": 15420.50,
    "totalSpend": 3200.00,
    "roas": 4.82,
    "totalOrders": 142,
    "averageOrderValue": 108.59,
    "conversionRate": 3.2,
    "impressions": 450000,
    "clicks": 8500,
    "ctr": 1.89,
    "cpc": 0.38,
    "cpa": 22.54,
    "revenueByDay": [
      { "date": "2024-01-15", "revenue": 520.00, "spend": 100.00 }
    ],
    "topProducts": [
      { "id": "prod-1", "title": "Premium Widget", "orders": 45, "revenue": 4500.00 }
    ],
    "topCampaigns": [
      { "id": "camp-1", "name": "Holiday Sale", "spend": 500, "revenue": 3200, "roas": 6.40 }
    ]
  }
}
```

With `?compare=true`, response includes `current`, `previous`, and `changes` objects with percentage deltas.

</details>

---

## 🧪 Testing

### Run All Tests

```bash
# From project root
npm test

# With verbose output
cd apps/web && npx vitest run --reporter=verbose

# Watch mode (re-runs on file save)
cd apps/web && npx vitest
```

### Test Suite Breakdown

| Suite | File | Tests | What's Covered |
|-------|------|------:|----------------|
| **Schemas** | `schemas.test.ts` | 26 | All Zod schemas — Shopify, Meta, Campaign, AI, Pagination, Plans |
| **Shopify** | `shopify-service.test.ts` | 6 | Product/order/customer sync, webhook registration, API errors |
| **Meta** | `meta-service.test.ts` | 8 | Campaign CRUD, ad sets, audiences, insights, budget conversion |
| **AI** | `ai-service.test.ts` | 6 | Anomaly detection (CPA/ROAS/CTR thresholds), product scoring |
| **Analytics** | `analytics.test.ts` | 7 | Metric aggregation, sorting, empty data, period comparisons |
| **API Utils** | `api-utils.test.ts` | 5 | `apiSuccess`, `apiError`, `AuthError` helpers |
| | | **60** | |

### Expected Output

```
 ✓ __tests__/schemas.test.ts > ShopifyConnectSchema > accepts valid domain
 ✓ __tests__/schemas.test.ts > CampaignCreateSchema > accepts all campaign types
 ✓ __tests__/shopify-service.test.ts > syncProducts > syncs products from Shopify API
 ✓ __tests__/meta-service.test.ts > creates campaign with budget in cents
 ✓ __tests__/ai-service.test.ts > detects ROAS drop below 1.0
 ✓ __tests__/analytics.test.ts > calculates metrics from orders and campaigns
 ...

 Test Files  6 passed (6)
      Tests  60 passed (60)
   Duration  1.17s
```

---

## 🐳 Docker

### Local Development Stack

```bash
# Start PostgreSQL + Redis
docker compose -f docker/docker-compose.yml up -d

# View logs
docker compose -f docker/docker-compose.yml logs -f db

# Stop everything
docker compose -f docker/docker-compose.yml down

# Full reset (delete all data)
docker compose -f docker/docker-compose.yml down -v
```

### Port Conflicts

Port `5432` is commonly used by Homebrew Postgres or SSH tunnels.

```bash
# Check what's using the port
lsof -i :5432

# Option A: Use port 5433 instead
sed -i '' 's/5432:5432/5433:5432/' docker/docker-compose.yml
sed -i '' 's/localhost:5432/localhost:5433/' .env
docker compose -f docker/docker-compose.yml up -d db

# Option B: Stop existing Postgres
brew services stop postgresql@16

# Option C: Kill the process
lsof -ti:5432 | xargs kill -9
```

### Database GUI

Prisma Studio gives you a visual browser for all 21 tables:

```bash
npx prisma studio --schema=packages/database/prisma/schema.prisma
```

Opens at [localhost:5555](http://localhost:5555) — browse Organizations, Products, Orders, Campaigns, AI Insights, etc.

---

## 🚀 Deployment

### Railway (Recommended)

```
Step 1    Push to GitHub
  │
  ▼
Step 2    railway.app → New Project → Connect repo
  │       (auto-detects railway.toml)
  ▼
Step 3    Add PostgreSQL service
  │       (DATABASE_URL auto-injected)
  ▼
Step 4    Set environment variables
  │       (all keys from .env.example)
  ▼
Step 5    Deploy → Health check passes → Live
```

```bash
# Push to GitHub
git init && git add . && git commit -m "Initial commit"
gh repo create growthpilot --private --push
```

The `railway.toml` configures everything:
- Multi-stage Docker build
- Health check on `/api/health`
- Auto-restart on failure (3 retries)

**Set up cron job** for data sync (every 6 hours):
```
GET https://your-app.up.railway.app/api/cron
Authorization: Bearer $CRON_SECRET
```

### Docker (Self-Hosted)

```bash
# Build
docker build -f docker/Dockerfile -t growthpilot .

# Run
docker run -p 3000:3000 --env-file .env growthpilot
```

---

## 🔧 Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack, port 3000) |
| `npm test` | Run all 60 tests |
| `npm run build` | Production build |
| `npx prisma studio --schema=packages/database/prisma/schema.prisma` | Visual database browser |
| `npx prisma db push --schema=packages/database/prisma/schema.prisma` | Push schema changes |
| `npx prisma generate --schema=packages/database/prisma/schema.prisma` | Regenerate typed client |
| `docker compose -f docker/docker-compose.yml up -d` | Start Postgres + Redis |
| `docker compose -f docker/docker-compose.yml logs db` | Database logs |

---

## 🛠 Troubleshooting

| Problem | Solution |
|---------|----------|
| `npm install` fails | `rm -rf node_modules package-lock.json && npm install` |
| Port 3000 in use | `lsof -ti:3000 \| xargs kill -9` |
| Port 5432 in use | See [Port Conflicts](#port-conflicts) above |
| Prisma generate fails | Run `npm install` first, then retry |
| Clerk auth errors | Verify both keys in `.env` (publishable + secret) |
| `turbo: command not found` | Use `npm run dev` — it calls Next.js directly |
| Docker not starting | Open Docker Desktop app, wait for engine to start |
| Tests fail on import | `npx prisma generate --schema=packages/database/prisma/schema.prisma` |
| `ECONNREFUSED` on DB | Check Postgres: `docker ps` — restart if needed |
| Vite CJS warning | Harmless deprecation notice — doesn't affect functionality |

---

## 📄 License

MIT

---

<div align="center">

**Built with Next.js 15, Prisma, Clerk, OpenAI, and lots of ☕**

[⬆ Back to top](#-growthpilot)

</div>