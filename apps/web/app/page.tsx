import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Layers,
  Rocket,
  Shield,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-0 overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-brand-500/[0.04] blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent-violet/[0.04] blur-[120px]" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-accent-cyan/[0.03] blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between max-w-7xl mx-auto px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-xl text-white">GrowthPilot</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#integrations" className="hover:text-white transition-colors">Integrations</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="btn-ghost text-sm">Sign in</Link>
          <Link href="/sign-up" className="btn-primary text-sm flex items-center gap-1.5">
            Get started <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-8 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5" />
          AI-powered growth for Shopify stores
        </div>

        <h1 className="text-5xl md:text-7xl font-display leading-[1.1] tracking-tight mb-6 animate-slide-up">
          <span className="text-white">Your ads on</span>
          <br />
          <span className="gradient-text">autopilot</span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up animate-delay-100">
          GrowthPilot connects your Shopify store to Meta Ads with AI that
          optimizes campaigns, discovers audiences, and scales revenue — all
          while you focus on your product.
        </p>

        <div className="flex items-center justify-center gap-4 animate-slide-up animate-delay-200">
          <Link href="/sign-up" className="btn-primary text-base px-8 py-3 flex items-center gap-2">
            Start free trial
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="#features" className="btn-secondary text-base px-8 py-3">
            See how it works
          </Link>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-8 max-w-xl mx-auto mt-20 animate-fade-in animate-delay-300">
          {[
            { value: "4.2x", label: "Avg. ROAS" },
            { value: "$2.1M+", label: "Revenue driven" },
            { value: "38%", label: "Lower CPA" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl md:text-3xl font-display text-white">{stat.value}</div>
              <div className="text-sm text-zinc-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 pb-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display text-white mb-4">
            Everything you need to grow
          </h2>
          <p className="text-zinc-400 max-w-lg mx-auto">
            From intelligent campaign creation to automated budget optimization — 
            GrowthPilot handles the complexity so you can focus on your business.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              icon: Bot,
              title: "AI Campaign Builder",
              description:
                "Describe your goals and let AI create high-performing Meta Ads campaigns with optimized targeting, copy, and creative.",
              color: "brand",
            },
            {
              icon: Target,
              title: "Smart Audiences",
              description:
                "AI analyzes your Shopify data to discover untapped audience segments and build high-converting lookalike audiences.",
              color: "violet",
            },
            {
              icon: Zap,
              title: "Auto-Optimization",
              description:
                "Set rules that automatically pause underperformers, scale winners, and reallocate budget in real-time.",
              color: "amber",
            },
            {
              icon: BarChart3,
              title: "Revenue Attribution",
              description:
                "Track every dollar from ad click to Shopify checkout with cross-platform attribution and cohort analysis.",
              color: "cyan",
            },
            {
              icon: Layers,
              title: "Product Intelligence",
              description:
                "AI scores your catalog to identify trending products, predict stockouts, and suggest dynamic ad creative.",
              color: "rose",
            },
            {
              icon: Shield,
              title: "Budget Guardrails",
              description:
                "Set spending limits, anomaly alerts, and approval workflows to protect your ad budget 24/7.",
              color: "brand",
            },
          ].map((feature) => (
            <div key={feature.title} className="card-hover p-6 group">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 
                  ${feature.color === "brand" ? "bg-brand-500/10 text-brand-400" : ""}
                  ${feature.color === "violet" ? "bg-accent-violet/10 text-accent-violet" : ""}
                  ${feature.color === "amber" ? "bg-accent-amber/10 text-accent-amber" : ""}
                  ${feature.color === "cyan" ? "bg-accent-cyan/10 text-accent-cyan" : ""}
                  ${feature.color === "rose" ? "bg-accent-rose/10 text-accent-rose" : ""}
                `}
              >
                <feature.icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-brand-400 transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-32">
        <div className="card p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 via-accent-cyan/5 to-accent-violet/5" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-display text-white mb-4">
              Ready to scale?
            </h2>
            <p className="text-zinc-400 mb-8 max-w-md mx-auto">
              Join hundreds of Shopify stores already using GrowthPilot to
              automate their growth with AI.
            </p>
            <Link href="/sign-up" className="btn-primary text-base px-8 py-3 inline-flex items-center gap-2">
              Start your free trial
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-surface-4 py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-brand-500" />
            <span>GrowthPilot</span>
          </div>
          <p>&copy; {new Date().getFullYear()} GrowthPilot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
