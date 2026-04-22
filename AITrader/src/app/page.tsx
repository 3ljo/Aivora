"use client";

import { useCallback, useEffect, useState } from "react";
import { ChatView } from "@/components/chat-view";
import type { TradingProfile } from "@/lib/types";

export default function HomePage() {
  const [profile, setProfile] = useState<TradingProfile | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/settings", { cache: "no-store" });
      const data = await res.json();
      setProfile(data.settings?.profile ?? null);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return <ChatView profile={profile} />;
}
