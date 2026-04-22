"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { MobileBottomNav, Sidebar, Topbar } from "./sidebar";
import { OnboardingWizard } from "./onboarding-wizard";
import type { TradingProfile } from "@/lib/types";

interface SettingsPayload {
  settings: {
    profile: TradingProfile | null;
  };
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<TradingProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/settings", { cache: "no-store" });
      const data = (await res.json()) as SettingsPayload;
      setProfile(data.settings?.profile ?? null);
    } catch {
      setProfile(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!loaded) {
    return (
      <main className="flex min-h-dvh items-center justify-center text-sm text-[color:var(--color-fg-dim)]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
      </main>
    );
  }

  if (!profile) {
    return <OnboardingWizard onComplete={(p) => setProfile(p)} />;
  }

  return (
    <div className="flex min-h-dvh">
      <Sidebar profile={profile} />
      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        <Topbar profile={profile} />
        <div className="flex-1">{children}</div>
      </div>
      <MobileBottomNav />
    </div>
  );
}
