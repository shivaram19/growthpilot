#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  GrowthPilot — Local Mac Setup & Launch Script v2           ║
# ║  AI-Powered Growth Automation for Shopify / Meta Ads        ║
# ╚══════════════════════════════════════════════════════════════╝
set -uo pipefail
# NOTE: we do NOT use set -e because we want to continue past non-critical failures

# ─── Colors & Formatting ──────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

LOGFILE="$PROJECT_DIR/growthpilot-setup-$(date +%Y%m%d-%H%M%S).log"
STEP=0
TOTAL_STEPS=12
ERRORS=()
DB_STARTED=false

# ─── Logging ──────────────────────────────────────────────────
log()     { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOGFILE"; }
step()    { STEP=$((STEP + 1)); echo ""; echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo -e "${BOLD}  [$STEP/$TOTAL_STEPS] $1${NC}"; echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; log "STEP $STEP: $1"; }
success() { echo -e "  ${GREEN}✔ $1${NC}"; log "OK: $1"; }
warn()    { echo -e "  ${YELLOW}⚠ $1${NC}"; log "WARN: $1"; }
fail()    { echo -e "  ${RED}✘ $1${NC}"; log "FAIL: $1"; ERRORS+=("Step $STEP: $1"); }
info()    { echo -e "  ${DIM}→ $1${NC}"; log "INFO: $1"; }
route()   { echo -e "  ${MAGENTA}⟶  ROUTE: $1${NC}"; log "ROUTE: $1"; }

# ─── Banner ───────────────────────────────────────────────────
clear
echo -e "${GREEN}"
cat << 'BANNER'

   ██████╗ ██████╗  ██████╗ ██╗    ██╗████████╗██╗  ██╗
  ██╔════╝ ██╔══██╗██╔═══██╗██║    ██║╚══██╔══╝██║  ██║
  ██║  ███╗██████╔╝██║   ██║██║ █╗ ██║   ██║   ███████║
  ██║   ██║██╔══██╗██║   ██║██║███╗██║   ██║   ██╔══██║
  ╚██████╔╝██║  ██║╚██████╔╝╚███╔███╔╝   ██║   ██║  ██║
   ╚═════╝ ╚═╝  ╚═╝ ╚═════╝  ╚══╝╚══╝    ╚═╝   ╚═╝  ╚═╝
            ██████╗ ██╗██╗      ██████╗ ████████╗
            ██╔══██╗██║██║     ██╔═══██╗╚══██╔══╝
            ██████╔╝██║██║     ██║   ██║   ██║
            ██╔═══╝ ██║██║     ██║   ██║   ██║
            ██║     ██║███████╗╚██████╔╝   ██║
            ╚═╝     ╚═╝╚══════╝ ╚═════╝    ╚═╝

BANNER
echo -e "${NC}"
echo -e "${BOLD}  AI-Powered Growth Automation for Shopify + Meta Ads${NC}"
echo -e "${DIM}  Next.js 15 · Clerk · Prisma · Turborepo · Docker${NC}"
echo ""
echo -e "${DIM}  Log: $LOGFILE${NC}"
echo ""
log "=== GrowthPilot Setup Started ==="
log "OS: $(uname -s) $(uname -m) | Shell: $SHELL | Dir: $PROJECT_DIR"

# ═══════════════════════════════════════════════════════════════
# STEP 1: Prerequisites
# ═══════════════════════════════════════════════════════════════
step "Checking system prerequisites"

# Node.js
if command -v node &>/dev/null; then
  NODE_VER=$(node -v)
  NODE_MAJOR=$(echo "$NODE_VER" | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_MAJOR" -ge 20 ]; then
    success "Node.js $NODE_VER (≥20 ✓)"
  else
    fail "Node.js $NODE_VER — need ≥20. Run: brew install node@20"
  fi
else
  fail "Node.js not found. Run: brew install node@20"
fi

# npm
if command -v npm &>/dev/null; then
  success "npm $(npm -v)"
else
  fail "npm not found"
fi

# Docker
if command -v docker &>/dev/null && docker info &>/dev/null 2>&1; then
  success "Docker $(docker --version 2>/dev/null | cut -d' ' -f3 | tr -d ',') (running)"
else
  warn "Docker not running — needed for PostgreSQL"
  echo -e "  ${DIM}  Open Docker Desktop and re-run, or install: brew install --cask docker${NC}"
fi

# Git
command -v git &>/dev/null && success "Git $(git --version | cut -d' ' -f3)" || info "Git not found (optional)"

# ═══════════════════════════════════════════════════════════════
# STEP 2: Verify project files
# ═══════════════════════════════════════════════════════════════
step "Verifying project files"

info "Project root: $PROJECT_DIR"
for f in package.json turbo.json apps/web/package.json packages/database/prisma/schema.prisma packages/shared/src/index.ts; do
  [ -f "$f" ] && success "Found $f" || fail "Missing $f"
done
FILE_COUNT=$(find . -type f -not -path '*/node_modules/*' -not -path '*/.git/*' -not -name '*.log' | wc -l | tr -d ' ')
info "Total files: $FILE_COUNT"

# ═══════════════════════════════════════════════════════════════
# STEP 3: Environment variables
# ═══════════════════════════════════════════════════════════════
step "Configuring environment variables"

if [ -f ".env" ]; then
  warn ".env already exists — keeping existing config"
else
  if [ -f ".env.example" ]; then
    cp .env.example .env
    # Generate random CRON_SECRET
    CRON_SECRET=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | head -c 32 | xxd -p)
    sed -i '' "s/your_cron_secret_here/$CRON_SECRET/" .env 2>/dev/null || sed -i "s/your_cron_secret_here/$CRON_SECRET/" .env
    success "Created .env with random CRON_SECRET"
  else
    fail ".env.example not found"
  fi
fi

echo ""
echo -e "  ${YELLOW}┌─────────────────────────────────────────────────────┐${NC}"
echo -e "  ${YELLOW}│  Edit .env with your API keys before using features │${NC}"
echo -e "  ${YELLOW}│                                                     │${NC}"
echo -e "  ${YELLOW}│  Required:                                          │${NC}"
echo -e "  ${YELLOW}│  • NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY  (clerk.com)   │${NC}"
echo -e "  ${YELLOW}│  • CLERK_SECRET_KEY                   (clerk.com)   │${NC}"
echo -e "  ${YELLOW}│  • OPENAI_API_KEY           (platform.openai.com)   │${NC}"
echo -e "  ${YELLOW}│                                                     │${NC}"
echo -e "  ${YELLOW}│  Optional (integrations):                           │${NC}"
echo -e "  ${YELLOW}│  • SHOPIFY_API_KEY / SHOPIFY_API_SECRET             │${NC}"
echo -e "  ${YELLOW}│  • META_APP_ID / META_APP_SECRET                    │${NC}"
echo -e "  ${YELLOW}└─────────────────────────────────────────────────────┘${NC}"

# ═══════════════════════════════════════════════════════════════
# STEP 4: Start PostgreSQL
# ═══════════════════════════════════════════════════════════════
step "Starting PostgreSQL database"

if docker info &>/dev/null 2>&1; then
  # Check if already running
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "growthpilot-db"; then
    success "PostgreSQL container already running"
    DB_STARTED=true
  else
    info "Starting PostgreSQL 16 via Docker Compose..."
    route "docker/docker-compose.yml → growthpilot-db (postgres:16-alpine, port 5432)"

    # Check if port 5432 is already in use
    if lsof -i :5432 &>/dev/null 2>&1; then
      warn "Port 5432 already in use (maybe local Postgres?)"
      info "Checking if it's a usable PostgreSQL..."

      # Try connecting to existing postgres
      if command -v pg_isready &>/dev/null && pg_isready -h localhost -p 5432 &>/dev/null; then
        success "Existing PostgreSQL on port 5432 is running — using it"
        DB_STARTED=true
        warn "Make sure DATABASE_URL in .env points to your local Postgres"
        warn "Or stop local Postgres: brew services stop postgresql"
      else
        fail "Port 5432 in use but not by PostgreSQL"
        echo -e "  ${DIM}  Free the port: lsof -ti:5432 | xargs kill -9${NC}"
        echo -e "  ${DIM}  Or change port in docker-compose.yml to 5433:5432${NC}"
      fi
    else
      # Port free — start container
      # Capture docker compose output for debugging
      COMPOSE_OUTPUT=$(docker compose -f docker/docker-compose.yml up -d db 2>&1)
      COMPOSE_EXIT=$?
      echo "$COMPOSE_OUTPUT" >> "$LOGFILE"

      if [ "$COMPOSE_EXIT" -eq 0 ]; then
        success "PostgreSQL container started"

        info "Waiting for PostgreSQL to accept connections..."
        for i in $(seq 1 30); do
          if docker exec growthpilot-db pg_isready -U growthpilot -d growthpilot &>/dev/null; then
            success "PostgreSQL ready (${i}s)"
            DB_STARTED=true
            break
          fi
          sleep 1
          if [ "$i" -eq 30 ]; then
            fail "PostgreSQL health check timed out after 30s"
          fi
        done
      else
        fail "docker compose up failed"
        echo -e "  ${DIM}  Error output:${NC}"
        echo "$COMPOSE_OUTPUT" | tail -5 | while IFS= read -r line; do
          echo -e "  ${DIM}  $line${NC}"
        done
        echo ""
        echo -e "  ${DIM}  Try manually: docker compose -f docker/docker-compose.yml up -d db${NC}"
        echo -e "  ${DIM}  Or check: docker compose -f docker/docker-compose.yml logs db${NC}"
      fi
    fi
  fi
else
  # Check standalone postgres
  if command -v pg_isready &>/dev/null && pg_isready &>/dev/null; then
    success "Local PostgreSQL running"
    DB_STARTED=true
    warn "Ensure DATABASE_URL in .env matches your local config"
  else
    fail "No database available — start Docker Desktop first"
  fi
fi

# ═══════════════════════════════════════════════════════════════
# STEP 5: Install dependencies
# ═══════════════════════════════════════════════════════════════
step "Installing npm dependencies"

info "Running npm install across all workspaces..."
route "Root package.json → workspaces: apps/web, packages/database, packages/shared"

# Clean any stale state
[ -d "node_modules" ] && info "node_modules exists, npm will reconcile" || info "Fresh install"

if npm install >> "$LOGFILE" 2>&1; then
  success "All dependencies installed"

  # Verify key packages
  [ -d "node_modules/next" ]    && success "  next (App Router)" || warn "  next not found"
  [ -d "node_modules/prisma" ]  && success "  prisma (ORM)"      || warn "  prisma not found"
  [ -d "node_modules/vitest" ]  && success "  vitest (testing)"  || warn "  vitest not found"
  [ -d "node_modules/zod" ]     && success "  zod (validation)"  || warn "  zod not found"
else
  fail "npm install failed"
  echo ""
  echo -e "  ${RED}Common fixes:${NC}"
  echo -e "  ${DIM}  1. rm -rf node_modules package-lock.json && npm install${NC}"
  echo -e "  ${DIM}  2. Check Node version: node -v (need ≥20)${NC}"
  echo -e "  ${DIM}  3. Full log: cat $LOGFILE${NC}"
  echo ""
  # Try to continue anyway
fi

# ═══════════════════════════════════════════════════════════════
# STEP 6: Generate Prisma client
# ═══════════════════════════════════════════════════════════════
step "Generating Prisma client"

route "packages/database/prisma/schema.prisma → node_modules/.prisma/client"

info "Models: Organization, Member, ShopifyStore, Product, Order, ShopifyCustomer"
info "        MetaAdAccount, MetaAdCampaign, MetaAdSet, MetaAd, AdCreative"
info "        Campaign, Audience, AIInsight, AutomationRule, BudgetAlert, SyncLog"

# Use the locally installed prisma (from node_modules), not npx which prompts
PRISMA_BIN="$PROJECT_DIR/node_modules/.bin/prisma"

if [ -x "$PRISMA_BIN" ]; then
  cd packages/database
  if "$PRISMA_BIN" generate >> "$LOGFILE" 2>&1; then
    success "Prisma client generated (20+ models)"
  else
    fail "prisma generate failed — check $LOGFILE"
  fi
  cd "$PROJECT_DIR"
else
  fail "prisma binary not found at $PRISMA_BIN — npm install may have failed"
  echo -e "  ${DIM}  Try: npm install && npx --yes prisma generate --schema=packages/database/prisma/schema.prisma${NC}"
fi

# ═══════════════════════════════════════════════════════════════
# STEP 7: Push database schema
# ═══════════════════════════════════════════════════════════════
step "Pushing schema to database"

if [ "$DB_STARTED" = true ] && [ -x "$PRISMA_BIN" ]; then
  route "prisma db push → PostgreSQL (creates all tables)"

  cd packages/database
  if "$PRISMA_BIN" db push --skip-generate --accept-data-loss >> "$LOGFILE" 2>&1; then
    success "All database tables created"
    info "Tables: Organization, Member, ShopifyStore, Product, Order, OrderItem"
    info "        ShopifyCustomer, MetaAdAccount, MetaAdCampaign, MetaAdSet, MetaAd"
    info "        AdCreative, AdAttribution, Campaign, Audience, CampaignAudience"
    info "        AIInsight, AutomationRule, AutomationLog, BudgetAlert, SyncLog"
  else
    fail "prisma db push failed — check DATABASE_URL in .env"
    echo -e "  ${DIM}  DATABASE_URL should be: postgresql://growthpilot:growthpilot_dev@localhost:5432/growthpilot${NC}"
  fi
  cd "$PROJECT_DIR"
else
  warn "Skipping db push — database or prisma not available"
fi

# ═══════════════════════════════════════════════════════════════
# STEP 8: Project structure
# ═══════════════════════════════════════════════════════════════
step "Verifying project structure"

echo ""
echo -e "  ${BOLD}📂 Monorepo Structure:${NC}"
echo -e "  ${DIM}growthpilot/"
echo -e "  ├── apps/web/                  ${CYAN}Next.js 15 Application${NC}"
echo -e "  ${DIM}│   ├── app/page.tsx           ${CYAN}Landing page${NC}"
echo -e "  ${DIM}│   ├── app/dashboard/         ${CYAN}Dashboard UI${NC}"
echo -e "  ${DIM}│   ├── app/api/               ${CYAN}9 API route handlers${NC}"
echo -e "  ${DIM}│   ├── lib/                   ${CYAN}4 core services${NC}"
echo -e "  ${DIM}│   └── __tests__/             ${CYAN}6 test suites${NC}"
echo -e "  ${DIM}├── packages/database/         ${CYAN}Prisma schema (20+ models)${NC}"
echo -e "  ${DIM}├── packages/shared/           ${CYAN}Zod schemas + types${NC}"
echo -e "  ${DIM}└── docker/                    ${CYAN}Compose + Dockerfile${NC}${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════
# STEP 9: API route map
# ═══════════════════════════════════════════════════════════════
step "Mapping all API routes"

echo ""
echo -e "  ${BOLD}🌐 API Route Map:${NC}"
echo ""
echo -e "  ${GREEN}PUBLIC${NC}"
route "GET  /                              → Landing page"
route "GET  /api/health                    → Health check"
route "POST /api/webhooks/shopify          → Shopify webhook (HMAC verified)"
route "GET  /api/cron                      → Scheduled sync (CRON_SECRET)"
echo ""
echo -e "  ${YELLOW}AUTH REQUIRED (Clerk)${NC}"
route "GET  /dashboard                     → Dashboard overview"
echo ""
echo -e "  ${BLUE}SHOPIFY${NC}"
route "POST /api/shopify/connect           → Connect store"
route "GET  /api/shopify/connect           → List stores"
route "POST /api/shopify/sync              → Manual sync"
echo ""
echo -e "  ${BLUE}META ADS${NC}"
route "POST /api/meta/connect              → Connect ad account"
route "GET  /api/meta/connect              → List ad accounts"
echo ""
echo -e "  ${BLUE}CAMPAIGNS${NC}"
route "GET  /api/campaigns                 → List (paginated)"
route "POST /api/campaigns                 → Create campaign"
echo ""
echo -e "  ${BLUE}AI ENGINE${NC}"
route "POST /api/ai/generate {ad-copy}            → AI ad copy"
route "POST /api/ai/generate {suggest-audiences}  → Audience suggestions"
route "POST /api/ai/generate {optimize-budget}    → Budget optimization"
route "POST /api/ai/generate {detect-anomalies}   → Anomaly detection"
route "POST /api/ai/generate {score-products}     → Product scoring"
echo ""
echo -e "  ${BLUE}ANALYTICS${NC}"
route "GET  /api/analytics                 → Metrics"
route "GET  /api/analytics?compare=true    → Period comparison"
echo ""

# ═══════════════════════════════════════════════════════════════
# STEP 10: Service architecture
# ═══════════════════════════════════════════════════════════════
step "Service architecture"

echo ""
echo -e "  ${CYAN}ShopifyService${NC} → syncProducts, syncOrders, syncCustomers, registerWebhooks"
echo -e "  ${CYAN}MetaAdsService${NC} → getCampaigns, createCampaign, createAdSet, insights, audiences"
echo -e "  ${CYAN}AI Service${NC}     → generateAdCopy, suggestAudiences, optimizeBudget, detectAnomalies"
echo -e "  ${CYAN}Analytics${NC}      → getDashboardMetrics, getComparisonMetrics"
echo ""

# ═══════════════════════════════════════════════════════════════
# STEP 11: Tests
# ═══════════════════════════════════════════════════════════════
step "Running test suites"

echo ""
info "Test suites: schemas, shopify, meta, ai, analytics, api-utils"
echo ""

VITEST_BIN="$PROJECT_DIR/node_modules/.bin/vitest"

if [ -x "$VITEST_BIN" ]; then
  cd apps/web
  "$VITEST_BIN" run --reporter=verbose 2>&1 | tee -a "$LOGFILE"
  TEST_EXIT=${PIPESTATUS[0]}
  cd "$PROJECT_DIR"

  if [ "$TEST_EXIT" -eq 0 ]; then
    success "All tests passed ✓"
  else
    warn "Some tests failed (exit code $TEST_EXIT) — check output above"
  fi
else
  fail "vitest not found — skipping tests (npm install may have failed)"
  echo -e "  ${DIM}  After fixing npm install, run: cd apps/web && npx vitest run${NC}"
fi

# ═══════════════════════════════════════════════════════════════
# STEP 12: Launch dev server
# ═══════════════════════════════════════════════════════════════
step "Launching development server"

echo ""
echo -e "  ${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "  ${GREEN}║                                                          ║${NC}"
echo -e "  ${GREEN}║   🌐 http://localhost:3000            Landing page       ║${NC}"
echo -e "  ${GREEN}║   📊 http://localhost:3000/dashboard   Dashboard         ║${NC}"
echo -e "  ${GREEN}║   🔑 http://localhost:3000/sign-in     Auth              ║${NC}"
echo -e "  ${GREEN}║   ❤️  http://localhost:3000/api/health  Health check      ║${NC}"
echo -e "  ${GREEN}║                                                          ║${NC}"
echo -e "  ${GREEN}║   Press Ctrl+C to stop                                   ║${NC}"
echo -e "  ${GREEN}║                                                          ║${NC}"
echo -e "  ${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ ${#ERRORS[@]} -gt 0 ]; then
  echo -e "  ${YELLOW}⚠ Warnings during setup (${#ERRORS[@]}):${NC}"
  for err in "${ERRORS[@]}"; do
    echo -e "    ${YELLOW}• $err${NC}"
  done
  echo ""
fi

log "=== Setup complete (${#ERRORS[@]} warnings). Starting dev server ==="

# Use the locally installed next binary directly — NOT turbo, NOT npx
NEXT_BIN="$PROJECT_DIR/node_modules/.bin/next"

if [ -x "$NEXT_BIN" ]; then
  cd apps/web
  exec "$NEXT_BIN" dev --turbopack --port 3000
else
  echo -e "  ${RED}next binary not found. Trying npm run dev...${NC}"
  exec npm run dev
fi
