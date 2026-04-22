"use client";

import { useState } from "react";
import { ScanPanel } from "@/components/scan-panel";

export default function ScannerPage() {
  const [, setRefresh] = useState(0);
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6">
      <div className="mb-4">
        <div className="text-xs uppercase tracking-wider text-[color:var(--color-fg-dim)]">Watchlist Scanner</div>
        <p className="mt-1 text-sm text-[color:var(--color-fg-dim)]">
          Run the AI across your top pairs to find live setups. Only spends tokens when you click <b>Scan</b>.
        </p>
      </div>
      <ScanPanel defaultExpanded onAlertCreated={() => setRefresh((x) => x + 1)} />
    </div>
  );
}
