# GrowthPilot — Complete Setup Guide & Route Documentation

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start (One Command)](#quick-start)
3. [Manual Setup Steps](#manual-setup)
4. [Every API Route Explained](#api-routes)
5. [Every Page Route Explained](#page-routes)
6. [Service Architecture](#services)
7. [Database Schema Map](#database)
8. [Test Coverage Map](#tests)
9. [Deployment Guide](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Tool | Version | Check Command | Install |
|------|---------|--------------|---------|
| Node.js | ≥ 20 | `node -v` | `brew install node@20` |
| npm | ≥ 10 | `npm -v` | Comes with Node.js |
| Docker | Latest | `docker --version` | `brew install --cask docker` |
| Git | Any | `git --version` | `brew install git` |

### API Keys Needed

| Service | Get Key From | Required? |
|---------|-------------|-----------|
| Clerk | https://clerk.com → Dashboard → API Keys | **Yes** |
| OpenAI | https://platform.openai.com/api-keys | **Yes** (for AI features) |
| Shopify | https://partners.shopify.com → Apps → Create App | For Shopify integration |
| Meta | https://developers.facebook.com → My Apps | For Meta Ads integration |

---

## Quick Start

```bash
# 1. Unzip the project
unzip growthpilot.zip
cd growthpilot

# 2. Run the automated setup
chmod +x start.sh
./start.sh
```

The script will:
- ✅ Check all prerequisites (Node, Docker, npm, git)
- ✅ Create `.env` from template
- ✅ Start PostgreSQL via Docker
- ✅ Install all npm dependencies
- ✅ Generate Prisma client
- ✅ Push database schema (create all tables)
- ✅ Run all 6 test suites
- ✅ Launch the dev server on http://localhost:3000

---

## Manual Setup Steps

If you prefer to run each step yourself:

```bash
# Step 1: Install dependencies
npm install

# Step 2: Setup environment
cp .env.example .env
# Edit .env with your API keys

# Step 3: Start PostgreSQL
cd docker && docker compose up -d db && cd ..

# Step 4: Generate Prisma client
cd packages/database && npx prisma generate && cd ../..

# Step 5: Push schema to database
cd packages/database && npx prisma db push && cd ../..

# Step 6: Run tests
cd apps/web && npx vitest run && cd ../..

# Step 7: Start dev server
npm run dev
```

---

## API Routes

### Authentication Flow

```
User visits /sign-in
  → Clerk handles OAuth/email auth
  → Redirects to /dashboard
  → middleware.ts intercepts all /dashboard/** routes
  → Clerk validates session token
  → getAuthOrg() finds/creates Organization record
  → User proceeds to authenticated route
```

### Complete Route Map

#### `GET /` — Landing Page
- **Auth**: Public
- **File**: `apps/web/app/page.tsx`
- **What it does**: Marketing homepage with features, stats, CTA
- **Response**: HTML page

#### `GET /api/health` — Health Check
- **Auth**: Public
- **File**: `apps/web/app/api/health/route.ts`
- **What it does**: Returns server status
- **Response**: `{ status: "ok", timestamp: "...", version: "..." }`

#### `POST /api/shopify/connect` — Connect Shopify Store
- **Auth**: Clerk (requires userId)
- **File**: `apps/web/app/api/shopify/connect/route.ts`
- **Flow**:
  1. Validates input with `ShopifyConnectSchema` (shopDomain, accessToken, scope)
  2. Checks for duplicate store
  3. Creates `ShopifyStore` record in DB
  4. Triggers background sync: products → orders → customers
  5. Returns `{ storeId, shopDomain }`
- **Error codes**: 422 (validation), 409 (duplicate), 500 (server)

#### `GET /api/shopify/connect` — List Connected Stores
- **Auth**: Clerk
- **File**: `apps/web/app/api/shopify/connect/route.ts`
- **Flow**:
  1. Gets organization ID from auth
  2. Queries stores with product/order/customer counts
  3. Includes last 5 sync logs
- **Response**: Array of stores with metadata

#### `POST /api/shopify/sync` — Manual Sync
- **Auth**: Clerk
- **File**: `apps/web/app/api/shopify/sync/route.ts`
- **Body**: `{ storeId: string, type?: "all" | "products" | "orders" | "customers" }`
- **Flow**:
  1. Creates `ShopifyService` instance for the store
  2. Calls sync methods based on type
  3. Each sync: API call → upsert to DB → sync log
- **Response**: `{ synced: { products: N, orders: N, customers: N } }`

#### `POST /api/webhooks/shopify` — Webhook Receiver
- **Auth**: HMAC signature verification
- **File**: `apps/web/app/api/webhooks/shopify/route.ts`
- **Headers required**: `X-Shopify-Hmac-Sha256`, `X-Shopify-Topic`, `X-Shopify-Shop-Domain`
- **Topics handled**:
  - `orders/create`, `orders/updated` → Upsert order
  - `products/create`, `products/update` → Upsert product
  - `products/delete` → Delete product
  - `app/uninstalled` → Deactivate store
- **Security**: HMAC-SHA256 signature verified against store's webhook secret

#### `POST /api/meta/connect` — Connect Meta Ad Account
- **Auth**: Clerk
- **File**: `apps/web/app/api/meta/connect/route.ts`
- **Body**: `{ accessToken, adAccountId, name }`
- **Flow**:
  1. Validates with `MetaConnectSchema`
  2. Creates `MetaAdAccount` record
  3. Background syncs campaigns with insights
- **Response**: `{ accountId }`

#### `GET /api/meta/connect` — List Ad Accounts
- **Auth**: Clerk
- **Response**: Accounts with campaign counts and top 5 campaigns

#### `GET /api/campaigns` — List Campaigns
- **Auth**: Clerk
- **Query params**: `page`, `limit`, `sortBy`, `sortOrder`, `status`
- **Response**: Paginated campaigns with Meta performance data and audience targets

#### `POST /api/campaigns` — Create Campaign
- **Auth**: Clerk
- **Body**: `{ name, type, goal?, budget?, startDate?, endDate?, audienceIds?, aiOptimized? }`
- **Types**: AWARENESS, TRAFFIC, CONVERSIONS, RETARGETING, LOOKALIKE, DYNAMIC_PRODUCT

#### `POST /api/ai/generate` — AI Actions
- **Auth**: Clerk
- **File**: `apps/web/app/api/ai/generate/route.ts`

##### `{action: "ad-copy"}`
- **Body**: `{ productId, tone?, platform?, targetAudience?, includeEmoji? }`
- **Flow**: Fetches product data → builds prompt → GPT-4o-mini → returns headline, primaryText, description, CTA + 2 variations
- **Tones**: professional, casual, urgent, playful, luxurious
- **Platforms**: meta_feed, meta_story, meta_reel

##### `{action: "suggest-audiences"}`
- **Body**: `{ productIds? }`
- **Flow**: Gathers store data (top products, AOV, customer metrics) → GPT analysis → returns 3-5 audience segments with rules and confidence scores

##### `{action: "optimize-budget"}`
- **Body**: `{ campaignIds, totalBudget, optimizeFor? }`
- **Flow**: Fetches campaign performance → GPT optimization → returns allocations with reasons and expected impact

##### `{action: "detect-anomalies"}`
- **Flow**: Statistical analysis of active campaigns → detects CPA spikes, ROAS drops, creative fatigue → stores as AIInsight records
- **Severity levels**: LOW, MEDIUM, HIGH, CRITICAL

##### `{action: "score-products"}`
- **Body**: `{ storeId }`
- **Flow**: Analyzes 30-day order data, inventory, pricing → composite 0-10 score per product

#### `GET /api/analytics` — Dashboard Metrics
- **Auth**: Clerk
- **Query params**: `compare`, `period` (day/week/month), `start`, `end`
- **Returns**: totalRevenue, totalSpend, roas, totalOrders, averageOrderValue, conversionRate, impressions, clicks, ctr, cpc, cpa, revenueByDay[], topProducts[], topCampaigns[], audienceBreakdown[]

#### `GET /api/cron` — Scheduled Sync
- **Auth**: `Authorization: Bearer $CRON_SECRET`
- **Flow**:
  1. Syncs all active Shopify stores (products + orders)
  2. Syncs all active Meta ad accounts (campaigns + insights)
  3. Runs anomaly detection for all orgs
  4. Scores products for all stores
- **Response**: Results summary per store/account

---

## Page Routes

| Route | Auth | Component | Description |
|-------|------|-----------|-------------|
| `/` | Public | `app/page.tsx` | Marketing landing page |
| `/sign-in` | Public | Clerk | Authentication |
| `/sign-up` | Public | Clerk | Registration |
| `/dashboard` | Protected | `app/dashboard/page.tsx` | Overview with metrics, charts, insights |

### Dashboard Features
- **Metric cards**: Revenue, ROAS, Orders, Ad Spend, Impressions, Clicks, CTR, AOV
- **Period selector**: 24h / 7d / 30d with % change indicators
- **Revenue chart**: Daily revenue vs spend bar chart with hover tooltips
- **Top Products**: Ranked by revenue with order counts
- **Top Campaigns**: Ranked by ROAS with spend/revenue
- **AI Insights Panel**: Quick access to AI-powered suggestions

---

## Services

### ShopifyService (`lib/shopify/service.ts`)
```
Constructor(shopDomain, accessToken, storeId)
├── syncProducts()      → GET /admin/api/2024-10/products.json
├── syncOrders()        → GET /admin/api/2024-10/orders.json
├── syncCustomers()     → GET /admin/api/2024-10/customers.json
├── registerWebhooks()  → POST /admin/api/2024-10/webhooks.json (×8)
└── getShopInfo()       → GET /admin/api/2024-10/shop.json
```

### MetaAdsService (`lib/meta/service.ts`)
```
Constructor(accessToken, adAccountId, dbAccountId)
├── getCampaigns()             → GET /{ver}/act_{id}/campaigns
├── createCampaign()           → POST /{ver}/act_{id}/campaigns
├── updateCampaignStatus()     → POST /{ver}/{campId}
├── createAdSet()              → POST /{ver}/act_{id}/adsets
├── createAd()                 → POST /{ver}/act_{id}/ads
├── getCampaignInsights()      → GET /{ver}/{campId}/insights
├── getAccountInsights()       → GET /{ver}/act_{id}/insights
├── createCustomAudience()     → POST /{ver}/act_{id}/customaudiences
├── createLookalikeAudience()  → POST /{ver}/act_{id}/customaudiences
└── syncCampaigns()            → Orchestrates fetch + DB upsert
```

### AI Service (`lib/ai/service.ts`)
```
├── generateAdCopy(input)       → OpenAI GPT-4o-mini (JSON mode)
├── suggestAudiences(orgId)     → Store data analysis → GPT
├── optimizeBudget(input)       → Campaign data → GPT optimization
├── detectAnomalies(orgId)      → Statistical + threshold analysis
└── scoreProducts(storeId)      → Composite scoring algorithm
```

---

## Database

### Entity Relationship Summary
```
Organization (1) ──→ (N) Member
Organization (1) ──→ (N) ShopifyStore
Organization (1) ──→ (N) MetaAdAccount
Organization (1) ──→ (N) Campaign
Organization (1) ──→ (N) Audience
Organization (1) ──→ (N) AIInsight
Organization (1) ──→ (N) AutomationRule
Organization (1) ──→ (N) BudgetAlert

ShopifyStore (1) ──→ (N) Product
ShopifyStore (1) ──→ (N) Order
ShopifyStore (1) ──→ (N) ShopifyCustomer

MetaAdAccount (1) ──→ (N) MetaAdCampaign
MetaAdCampaign (1) ──→ (N) MetaAdSet
MetaAdSet (1) ──→ (N) MetaAd

Order (1) ──→ (N) OrderItem
Order (1) ──→ (N) AdAttribution
Campaign (N) ←──→ (N) Audience (via CampaignAudience)
```

---

## Tests

| Suite | File | Tests | Covers |
|-------|------|-------|--------|
| Schemas | `schemas.test.ts` | ~50 | All Zod validation schemas, plan constants |
| Shopify | `shopify-service.test.ts` | ~8 | Product/order/customer sync, webhooks, errors |
| Meta | `meta-service.test.ts` | ~8 | Campaigns, ad sets, audiences, insights, sync |
| AI | `ai-service.test.ts` | ~6 | Anomaly detection, product scoring |
| Analytics | `analytics.test.ts` | ~7 | Metrics calculation, comparisons, sorting |
| API Utils | `api-utils.test.ts` | ~5 | apiSuccess, apiError, AuthError |

Run: `cd apps/web && npx vitest run --reporter=verbose`

---

## Deployment

### Railway (Recommended)
1. Push to GitHub
2. Create Railway project → New Service → Connect repo
3. Add PostgreSQL service
4. Set all env vars from `.env.example`
5. Railway detects `railway.toml` → builds via Docker
6. Add cron service: `curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.railway.app/api/cron`

### Docker (Self-hosted)
```bash
cd docker
docker compose up -d        # Starts PostgreSQL + Redis + app
docker compose logs -f web  # Watch app logs
```

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| `npm install` fails | Delete `node_modules` and `package-lock.json`, retry |
| Prisma generate fails | Check you're in `packages/database/` directory |
| Database connection refused | Ensure Docker is running: `docker compose up -d db` |
| Clerk auth errors | Verify `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in `.env` |
| Port 3000 in use | Kill process: `lsof -ti:3000 \| xargs kill -9` |
| Docker not starting | Open Docker Desktop first, wait for it to initialize |
| Tests fail on import | Run `npx prisma generate` in packages/database first |
