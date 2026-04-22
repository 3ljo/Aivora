"use client";

import { Wallet, Target, Clock, Layers } from "lucide-react";
import type { TradingProfile } from "@/lib/types";

export function ProfileSummary({ profile }: { profile: TradingProfile }) {
  return (
    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
      <div className="mb-3 text-xs uppercase tracking-wider text-[color:var(--color-fg-dim)]">
        Your Trading Profile
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          icon={Wallet}
          label="Account"
          value={`${profile.accountCurrency} ${profile.accountBalance.toLocaleString()}`}
          hint={`1:${profile.leverage} leverage`}
        />
        <Stat
          icon={Target}
          label="Risk / Trade"
          value={`${profile.riskPerTradePct}%`}
          hint={`R:R target ${profile.preferredRR}:1`}
        />
        <Stat
          icon={Layers}
          label="Style"
          value={profile.strategyStyle.charAt(0).toUpperCase() + profile.strategyStyle.slice(1)}
          hint={profile.brokerType === "prop" ? `Prop (${profile.propFirm?.firmName ?? "firm"})` : "Personal"}
        />
        <Stat
          icon={Clock}
          label="Session"
          value={profile.session.replace("-", " ").toUpperCase()}
          hint={profile.avoidNews ? "News blackout on" : "News blackout off"}
        />
      </div>
      {profile.watchlist.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {profile.watchlist.map((w) => (
            <span
              key={w}
              className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-2 py-0.5 font-mono text-xs"
            >
              {w}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-[color:var(--color-fg-dim)]">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold">{value}</div>
      {hint && <div className="text-xs text-[color:var(--color-fg-dim)]">{hint}</div>}
    </div>
  );
}
