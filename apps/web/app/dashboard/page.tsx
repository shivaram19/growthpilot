"use client";

import { useState, useEffect } from "react";
import {
  ArrowDown,
  ArrowUp,
  Bot,
  DollarSign,
  Eye,
  MousePointerClick,
  Package,
  ShoppingCart,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { DashboardMetrics } from "@growthpilot/shared";

// ─── Metric Card Component ─────────────────────────────────────

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  prefix = "",
  suffix = "",
  format = "number",
}: {
  title: string;
  value: number;
  change?: number;
  icon: React.ElementType;
  prefix?: string;
  suffix?: string;
  format?: "number" | "currency" | "percent";
}) {
  const formatValue = (v: number) => {
    if (format === "currency") return `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (format === "percent") return `${v.toFixed(2)}%`;
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
    return v.toLocaleString();
  };

  return (
    <div className="metric-card group hover:border-surface-5 transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</span>
        <Icon className="w-4 h-4 text-zinc-600" />
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-semibold text-white">
          {prefix}{formatValue(value)}{suffix}
        </span>
        {change !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-medium pb-1 ${change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Mini Revenue Chart ────────────────────────────────────────

function RevenueChart({ data }: { data: Array<{ date: string; revenue: number; spend: number }> }) {
  if (!data.length) return <EmptyState message="No revenue data yet" />;

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const barWidth = Math.max(4, Math.min(12, (100 / data.length)));

  return (
    <div className="card p-6">
      <h3 className="text-sm font-medium text-zinc-400 mb-4">Revenue vs Spend (30 days)</h3>
      <div className="flex items-end gap-1 h-40">
        {data.map((d, i) => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 group relative">
            <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
              <div className="bg-surface-3 border border-surface-4 rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-xl">
                <p className="text-zinc-400">{d.date}</p>
                <p className="text-emerald-400">Revenue: ${d.revenue.toFixed(0)}</p>
                <p className="text-accent-amber">Spend: ${d.spend.toFixed(0)}</p>
              </div>
            </div>
            <div
              className="w-full bg-brand-500/20 rounded-t transition-all duration-300 hover:bg-brand-500/30"
              style={{ height: `${(d.revenue / maxRevenue) * 100}%`, minHeight: "2px" }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-zinc-600">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

// ─── Top Products Table ────────────────────────────────────────

function TopProducts({ products }: { products: DashboardMetrics["topProducts"] }) {
  if (!products.length) return <EmptyState message="No product data yet" />;

  return (
    <div className="card p-6">
      <h3 className="text-sm font-medium text-zinc-400 mb-4">Top Products</h3>
      <div className="space-y-3">
        {products.slice(0, 5).map((product, i) => (
          <div key={product.id} className="flex items-center gap-3">
            <span className="w-5 h-5 rounded bg-surface-3 flex items-center justify-center text-[10px] text-zinc-500 font-mono">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-200 truncate">{product.title}</p>
              <p className="text-xs text-zinc-500">{product.orders} orders</p>
            </div>
            <span className="text-sm font-medium text-white">${product.revenue.toFixed(0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Top Campaigns Table ───────────────────────────────────────

function TopCampaigns({ campaigns }: { campaigns: DashboardMetrics["topCampaigns"] }) {
  if (!campaigns.length) return <EmptyState message="No campaigns yet" />;

  return (
    <div className="card p-6">
      <h3 className="text-sm font-medium text-zinc-400 mb-4">Top Campaigns by ROAS</h3>
      <div className="space-y-3">
        {campaigns.slice(0, 5).map((campaign) => (
          <div key={campaign.id} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-200 truncate">{campaign.name}</p>
              <p className="text-xs text-zinc-500">Spend: ${campaign.spend.toFixed(0)}</p>
            </div>
            <div className="text-right">
              <span className={`text-sm font-medium ${campaign.roas >= 2 ? "text-emerald-400" : campaign.roas >= 1 ? "text-accent-amber" : "text-red-400"}`}>
                {campaign.roas.toFixed(2)}x
              </span>
              <p className="text-xs text-zinc-500">${campaign.revenue.toFixed(0)} rev</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="card p-8 flex flex-col items-center justify-center text-center">
      <Package className="w-8 h-8 text-zinc-600 mb-3" />
      <p className="text-sm text-zinc-500">{message}</p>
      <p className="text-xs text-zinc-600 mt-1">Connect your store to get started</p>
    </div>
  );
}

// ─── AI Insights Panel ────────────────────────────────────────

function AIInsightsPanel() {
  return (
    <div className="card p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-accent-violet/5" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-brand-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">AI Insights</h3>
            <p className="text-xs text-zinc-500">Powered by GrowthPilot AI</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="bg-surface-3/50 rounded-lg p-3 border border-surface-4">
            <p className="text-xs text-zinc-300">
              Connect your Shopify store and Meta Ads account to unlock AI-powered insights,
              audience suggestions, and budget optimization.
            </p>
          </div>
          <button className="btn-primary w-full text-sm">
            <Bot className="w-4 h-4 mr-2 inline" />
            Get Started with AI
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Page ────────────────────────────────────────────

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [changes, setChanges] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"day" | "week" | "month">("month");

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch(`/api/analytics?compare=true&period=${period}`);
        const data = await res.json();
        if (data.success) {
          setMetrics(data.data.current);
          setChanges(data.data.changes);
        }
      } catch {
        // Use empty metrics for demo
        setMetrics({
          totalRevenue: 0, totalSpend: 0, roas: 0, totalOrders: 0,
          averageOrderValue: 0, conversionRate: 0, impressions: 0,
          clicks: 0, ctr: 0, cpc: 0, cpa: 0,
          revenueByDay: [], topProducts: [], topCampaigns: [], audienceBreakdown: [],
        });
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, [period]);

  if (loading) {
    return (
      <div className="p-8 animate-pulse space-y-6">
        <div className="h-8 w-48 bg-surface-3 rounded" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-surface-2 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-52 bg-surface-2 rounded-xl" />
          <div className="h-52 bg-surface-2 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-white">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">Your growth at a glance</p>
        </div>
        <div className="flex items-center gap-2">
          {(["day", "week", "month"] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                period === p ? "bg-surface-3 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}>
              {p === "day" ? "24h" : p === "week" ? "7d" : "30d"}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Revenue" value={metrics.totalRevenue} change={changes.totalRevenue} icon={DollarSign} format="currency" />
        <MetricCard title="ROAS" value={metrics.roas} change={changes.roas} icon={TrendingUp} suffix="x" />
        <MetricCard title="Orders" value={metrics.totalOrders} change={changes.totalOrders} icon={ShoppingCart} />
        <MetricCard title="Ad Spend" value={metrics.totalSpend} change={changes.totalSpend} icon={DollarSign} format="currency" />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Impressions" value={metrics.impressions} icon={Eye} />
        <MetricCard title="Clicks" value={metrics.clicks} change={changes.clicks} icon={MousePointerClick} />
        <MetricCard title="CTR" value={metrics.ctr} change={changes.ctr} icon={MousePointerClick} format="percent" />
        <MetricCard title="AOV" value={metrics.averageOrderValue} change={changes.averageOrderValue} icon={ShoppingCart} format="currency" />
      </div>

      {/* Charts & Tables */}
      <div className="grid md:grid-cols-2 gap-4">
        <RevenueChart data={metrics.revenueByDay} />
        <AIInsightsPanel />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <TopProducts products={metrics.topProducts} />
        <TopCampaigns campaigns={metrics.topCampaigns} />
      </div>
    </div>
  );
}
