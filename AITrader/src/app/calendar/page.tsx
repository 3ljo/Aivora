"use client";

import { CalendarPanel } from "@/components/calendar-panel";

export default function CalendarPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6">
      <div className="mb-4">
        <div className="text-xs uppercase tracking-wider text-[color:var(--color-fg-dim)]">Economic Calendar</div>
        <p className="mt-1 text-sm text-[color:var(--color-fg-dim)]">
          Upcoming red-folder events that can move markets. Data from ForexFactory · refreshes every 15 minutes.
        </p>
      </div>
      <CalendarPanel defaultExpanded />
    </div>
  );
}
