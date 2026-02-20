import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { BarChart3, Bot, Home, Megaphone, Rocket, Settings, ShoppingBag, Users, Zap } from "lucide-react";

const nav = [
  { name: "Overview", href: "/dashboard", icon: Home },
  { name: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone },
  { name: "Products", href: "/dashboard/products", icon: ShoppingBag },
  { name: "Audiences", href: "/dashboard/audiences", icon: Users },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "AI Insights", href: "/dashboard/insights", icon: Bot },
  { name: "Automations", href: "/dashboard/automations", icon: Zap },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-[260px] flex-shrink-0 bg-surface-1 border-r border-surface-4 flex flex-col">
        <div className="p-5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-lg text-white">GrowthPilot</span>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {nav.map((item) => (
            <Link key={item.name} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-surface-3 transition-colors group">
              <item.icon className="w-[18px] h-[18px] group-hover:text-brand-400 transition-colors" />
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-surface-4">
          <div className="flex items-center gap-3">
            <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-300 truncate">My Workspace</p>
              <p className="text-xs text-zinc-500">Free Plan</p>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-surface-0">{children}</main>
    </div>
  );
}
