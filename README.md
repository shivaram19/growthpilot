# GrowthPilot — AI-Powered Growth Automation Platform

An end-to-end AI growth automation platform for Shopify stores with Meta Ads integration. Built with a modern monorepo architecture for scalability and developer experience.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router, Turbopack) |
| **Auth** | Clerk (multi-tenant, org support) |
| **Database** | PostgreSQL + Prisma ORM |
| **Monorepo** | Turborepo |
| **Styling** | Tailwind CSS |
| **AI** | OpenAI GPT-4o-mini |
| **Integrations** | Shopify Admin API, Meta Marketing API |
| **Deployment** | Railway + Docker |
| **Testing** | Vitest + Testing Library + Playwright |

## Architecture

```
growthpilot/
├── apps/
│   └── web/                    # Next.js 15 web application
│       ├── app/                # App Router pages & API routes
│       │   ├── api/
│       │   │   ├── ai/        # AI generation endpoints
│       │   │   ├── analytics/  # Dashboard metrics
│       │   │   ├── campaigns/  # Campaign CRUD
│       │   │   ├── cron/       # Scheduled sync jobs
│       │   │   ├── meta/       # Meta Ads integration
│       │   │   ├── shopify/    # Shopify integration
│       │   │   └── webhooks/   # Shopify webhook handler
│       │   └── dashboard/      # Dashboard UI
│       ├── lib/
│       │   ├── ai/             # AI service (ad copy, audiences, anomalies)
│       │   ├── meta/           # Meta Marketing API client
│       │   ├── prisma/         # Database client
│       │   ├── shopify/        # Shopify Admin API client
│       │   └── utils/          # Auth, analytics helpers
│       └── __tests__/          # Test suites
├── packages/
│   ├── database/               # Prisma schema & client
│   └── shared/                 # Zod schemas, types, constants
├── docker/
│   ├── Dockerfile              # Production multi-stage build
│   └── docker-compose.yml      # Local dev stack
├── turbo.json                  # Turborepo pipeline config
└── railway.toml                # Railway deployment config
```

## Features

### Shopify Integration
- **Store connection** via OAuth with automatic webhook registration
- **Product sync** — full catalog sync with pagination, inventory tracking
- **Order sync** — order history with line items and customer attribution
- **Customer sync** — customer profiles with spend data and segmentation
- **Real-time webhooks** — orders/create, products/update, app/uninstalled, etc.
- **HMAC verification** — secure webhook signature validation

### Meta Ads Integration
- **Ad account connection** with token management
- **Campaign management** — create, pause, update campaigns via API
- **Ad set creation** — targeting configuration, budget allocation
- **Performance sync** — spend, impressions, clicks, conversions, ROAS
- **Custom audiences** — create and upload customer segments
- **Lookalike audiences** — expand reach with AI-optimized lookalikes

### AI-Powered Features
- **Ad copy generation** — AI writes headlines, primary text, descriptions with tone/platform targeting
- **Audience suggestions** — analyzes store data to discover untapped segments
- **Budget optimization** — reallocates spend across campaigns for max ROAS
- **Anomaly detection** — identifies CPA spikes, ROAS drops, creative fatigue
- **Product scoring** — AI-computed performance scores (0-10) for catalog prioritization

### Dashboard & Analytics
- **Real-time metrics** — revenue, ROAS, orders, spend, CTR, CPC, CPA
- **Period comparison** — day/week/month with percentage changes
- **Revenue charts** — daily revenue vs spend visualization
- **Top products** — ranked by revenue with order counts
- **Top campaigns** — ranked by ROAS with spend/revenue data
- **Audience breakdown** — segment sizes and conversion data

### Automation Engine
- **Rule-based triggers** — ROAS drop, budget threshold, CPA spike, creative fatigue, inventory low
- **Automated actions** — pause/scale campaigns, reallocate budget, send alerts
- **Execution logging** — full audit trail with input/output/error tracking
- **Budget guardrails** — spending limits with threshold alerts

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Redis 7+ (optional, for job queue)

### Setup

```bash
# Clone and install
git clone <repo-url> growthpilot
cd growthpilot
npm install

# Setup environment
cp .env.example .env
# Edit .env with your actual keys

# Setup database
npx turbo db:generate
npx turbo db:push

# Run development
npm run dev
```

### Docker Setup

```bash
cd docker
docker compose up -d

# Run migrations
npx turbo db:push
```

### Running Tests

```bash
# All tests
npm run test

# With coverage
cd apps/web && npm run test:coverage

# Watch mode
cd apps/web && npm run test:watch
```

## API Reference

### Shopify
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/shopify/connect` | Connect Shopify store |
| GET | `/api/shopify/connect` | List connected stores |
| POST | `/api/shopify/sync` | Trigger manual sync |

### Meta Ads
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/meta/connect` | Connect Meta ad account |
| GET | `/api/meta/connect` | List ad accounts |

### AI
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/ai/generate` | `{action: "ad-copy", productId, tone, platform}` | Generate ad copy |
| POST | `/api/ai/generate` | `{action: "suggest-audiences"}` | AI audience suggestions |
| POST | `/api/ai/generate` | `{action: "optimize-budget", campaignIds, totalBudget}` | Budget optimization |
| POST | `/api/ai/generate` | `{action: "detect-anomalies"}` | Anomaly detection |
| POST | `/api/ai/generate` | `{action: "score-products", storeId}` | Product scoring |

### Analytics
| Method | Endpoint | Params | Description |
|--------|----------|--------|-------------|
| GET | `/api/analytics` | `compare, period, start, end` | Dashboard metrics |

### Campaigns
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns` | List campaigns (paginated) |
| POST | `/api/campaigns` | Create campaign |

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/shopify` | Shopify webhook receiver |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/cron` | Scheduled sync (requires CRON_SECRET) |

## Environment Variables

See `.env.example` for all required variables. Key ones:

- `DATABASE_URL` — PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` — Clerk auth
- `SHOPIFY_API_KEY` / `SHOPIFY_API_SECRET` — Shopify app credentials
- `META_APP_ID` / `META_APP_SECRET` — Meta app credentials
- `OPENAI_API_KEY` — OpenAI for AI features
- `CRON_SECRET` — Bearer token for cron endpoint

## Deployment (Railway)

1. Create a Railway project with PostgreSQL
2. Connect your GitHub repo
3. Set all environment variables
4. Railway auto-detects `railway.toml` and builds via Docker
5. Set up a cron service pointing to `/api/cron` with `Authorization: Bearer $CRON_SECRET`

## License

MIT
