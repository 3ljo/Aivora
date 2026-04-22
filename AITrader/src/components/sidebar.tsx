"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarDays, MessageCircle, Radar, Settings2, Sparkles } from "lucide-react";
import type { TradingProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/", label: "Chat", Icon: MessageCircle, hint: "Analyze a pair / upload a chart" },
  { href: "/scanner", label: "Scanner", Icon: Radar, hint: "Scan your watchlist" },
  { href: "/alerts", label: "Alerts", Icon: Bell, hint: "Saved triggers" },
  { href: "/calendar", label: "Calendar", Icon: CalendarDays, hint: "Economic events" },
] as const;

export function Sidebar({ profile }: { profile: TradingProfile | null }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-[color:var(--color-border)] bg-[color:var(--color-surface)] md:flex md:flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-[color:var(--color-border)] px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-cyan-400 to-emerald-500 text-black">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold leading-none">SignalForge</div>
          <div className="mt-0.5 text-[10px] uppercase tracking-wider text-[color:var(--color-fg-dim)]">AI Analyst</div>
        </div>
      </div>

      <nav className="flex-1 p-2">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            const Icon = item.Icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                    active
                      ? "bg-cyan-500/15 text-cyan-300"
                      : "text-[color:var(--color-fg)] hover:bg-[color:var(--color-surface-2)]",
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-cyan-400" : "text-[color:var(--color-fg-dim)]")} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-[color:var(--color-border)] p-2">
        {profile && (
          <div className="mb-2 rounded-md bg-[color:var(--color-surface-2)] px-3 py-2 text-[11px]">
            <div className="font-mono">
              {profile.accountCurrency} {profile.accountBalance.toLocaleString()}
            </div>
            <div className="text-[color:var(--color-fg-dim)]">
              {profile.strategyStyle} · {profile.riskPerTradePct}% risk · 1:{profile.preferredRR} RR
            </div>
          </div>
        )}
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
            pathname === "/settings"
              ? "bg-cyan-500/15 text-cyan-300"
              : "text-[color:var(--color-fg)] hover:bg-[color:var(--color-surface-2)]",
          )}
        >
          <Settings2
            className={cn(
              "h-4 w-4",
              pathname === "/settings" ? "text-cyan-400" : "text-[color:var(--color-fg-dim)]",
            )}
          />
          <span className="font-medium">Settings</span>
        </Link>
      </div>
    </aside>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const items = [...NAV_ITEMS, { href: "/settings", label: "Settings", Icon: Settings2, hint: "" }];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)]/95 backdrop-blur md:hidden">
      <ul className="flex items-stretch justify-around">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.Icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition",
                  active ? "text-cyan-400" : "text-[color:var(--color-fg-dim)]",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Topbar({ profile }: { profile: TradingProfile | null }) {
  const pathname = usePathname();
  const title =
    NAV_ITEMS.find((i) => i.href === pathname)?.label ??
    (pathname === "/settings" ? "Settings" : "SignalForge");

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)]/80 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-cyan-400 to-emerald-500 text-black md:hidden">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="text-base font-semibold tracking-tight">{title}</div>
      </div>
      {profile && (
        <div className="hidden items-center gap-3 text-xs text-[color:var(--color-fg-dim)] sm:flex">
          <span className="font-mono">
            {profile.accountCurrency} {profile.accountBalance.toLocaleString()}
          </span>
          <span>·</span>
          <span>{profile.strategyStyle}</span>
          <span>·</span>
          <span>{profile.riskPerTradePct}% risk</span>
          <span>·</span>
          <span>{profile.session.replace("-", " ")}</span>
        </div>
      )}
    </header>
  );
}
