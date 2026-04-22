"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, Loader2, Send, Trash2 } from "lucide-react";
import type { UserSettings } from "@/lib/alerts/settings";
import { cn } from "@/lib/utils";
import { ProfileEditor } from "@/components/profile-editor";
import { DEFAULT_PROFILE } from "@/lib/profile";

interface SettingsPayload {
  settings: UserSettings;
  capabilities: { telegramBot: boolean };
  telegramBotUsername: string | null;
}

export default function SettingsPage() {
  const [data, setData] = useState<SettingsPayload | null>(null);
  const [tgLinkState, setTgLinkState] = useState<"idle" | "waiting" | "linked" | "error">("idle");
  const [tgError, setTgError] = useState<string | null>(null);
  const [tgDeepLink, setTgDeepLink] = useState<string | null>(null);
  const pollTimer = useRef<NodeJS.Timeout | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/settings", { cache: "no-store" });
    const json = (await res.json()) as SettingsPayload;
    setData(json);
  }, []);

  useEffect(() => {
    load();
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [load]);

  async function toggleTelegram(value: boolean) {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channels: { telegram: value } }),
    });
    load();
  }

  async function startTelegramLink() {
    setTgLinkState("waiting");
    setTgError(null);
    try {
      const res = await fetch("/api/telegram/link", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const { code, deepLink } = (await res.json()) as { code: string; deepLink: string };
      setTgDeepLink(deepLink);
      window.open(deepLink, "_blank", "noopener,noreferrer");

      if (pollTimer.current) clearInterval(pollTimer.current);
      const started = Date.now();
      pollTimer.current = setInterval(async () => {
        if (Date.now() - started > 5 * 60 * 1000) {
          clearInterval(pollTimer.current!);
          pollTimer.current = null;
          setTgLinkState("error");
          setTgError("Link timed out after 5 minutes. Try again.");
          return;
        }
        try {
          const check = await fetch(`/api/telegram/link?code=${encodeURIComponent(code)}`, { cache: "no-store" });
          const j = (await check.json()) as { status: "pending" | "linked" | "expired"; username?: string };
          if (j.status === "linked") {
            clearInterval(pollTimer.current!);
            pollTimer.current = null;
            setTgLinkState("linked");
            setTgDeepLink(null);
            await load();
          } else if (j.status === "expired") {
            clearInterval(pollTimer.current!);
            pollTimer.current = null;
            setTgLinkState("error");
            setTgError("Link code expired. Try again.");
          }
        } catch {
          /* keep polling */
        }
      }, 2500);
    } catch (err) {
      setTgLinkState("error");
      setTgError(err instanceof Error ? err.message : String(err));
    }
  }

  async function disconnectTelegram() {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telegram: { chatId: null, username: null, linkedAt: null },
        channels: { telegram: false },
      }),
    });
    setTgLinkState("idle");
    setTgDeepLink(null);
    load();
  }

  if (!data) {
    return (
      <div className="flex h-[calc(100dvh-3.5rem)] items-center justify-center text-sm text-[color:var(--color-fg-dim)]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading settings…
      </div>
    );
  }

  const { settings, capabilities } = data;

  return (
    <div>
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <ProfileEditor
            initial={settings.profile ?? DEFAULT_PROFILE}
            onSaved={() => load()}
          />
        </div>

        <div className="mb-3 text-sm text-[color:var(--color-fg-dim)]">
          Connect Telegram to get pinged on your phone when a trade signal fires. Free, unlimited.
        </div>

        <div className="mb-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-cyan-400" />
                <div className="text-sm font-semibold">Telegram</div>
                {!capabilities.telegramBot && (
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                    Server not configured
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-xs text-[color:var(--color-fg-dim)]">
                Instant push to your phone. Works even when the app is closed.
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={settings.channels.telegram}
                onChange={(e) => toggleTelegram(e.target.checked)}
                disabled={!settings.telegram.chatId || !capabilities.telegramBot}
                className="h-4 w-4 accent-cyan-400"
              />
              Enabled
            </label>
          </div>

          {settings.telegram.chatId ? (
            <div className="flex items-center justify-between rounded-lg border border-green-500/40 bg-green-500/5 p-3">
              <div>
                <div className="text-sm">
                  Connected as{" "}
                  <span className="font-mono font-semibold text-green-400">
                    {settings.telegram.username ?? `id:${settings.telegram.chatId}`}
                  </span>
                </div>
                <div className="text-xs text-[color:var(--color-fg-dim)]">
                  Linked {settings.telegram.linkedAt ? new Date(settings.telegram.linkedAt).toLocaleString() : ""}
                </div>
              </div>
              <button
                onClick={disconnectTelegram}
                className="flex items-center gap-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-2 py-1 text-xs text-[color:var(--color-fg-dim)] hover:border-red-500/50 hover:text-red-400"
                title="Disconnect"
              >
                <Trash2 className="h-3 w-3" /> Disconnect
              </button>
            </div>
          ) : (
            <div>
              {capabilities.telegramBot ? (
                <>
                  <button
                    onClick={startTelegramLink}
                    disabled={tgLinkState === "waiting"}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
                      "bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-60",
                    )}
                  >
                    {tgLinkState === "waiting" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                    {tgLinkState === "waiting" ? "Waiting for you in Telegram…" : "Connect Telegram"}
                  </button>
                  {tgLinkState === "waiting" && tgDeepLink && (
                    <div className="mt-3 rounded-md border border-cyan-500/30 bg-cyan-500/5 p-3 text-xs">
                      A new tab opened in Telegram. Tap <b>Start</b> in the bot chat.
                      <br />
                      <span className="text-[color:var(--color-fg-dim)]">
                        If the tab didn&apos;t open,{" "}
                        <a href={tgDeepLink} target="_blank" rel="noreferrer" className="text-cyan-400 underline">
                          click here
                        </a>
                        .
                      </span>
                    </div>
                  )}
                  {tgError && <div className="mt-2 text-xs text-red-400">{tgError}</div>}
                </>
              ) : (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-2 text-xs text-amber-300">
                  Telegram bot not set up on the server. Add{" "}
                  <code className="rounded bg-black/30 px-1 font-mono">TELEGRAM_BOT_TOKEN</code> and{" "}
                  <code className="rounded bg-black/30 px-1 font-mono">TELEGRAM_BOT_USERNAME</code> to{" "}
                  <code className="rounded bg-black/30 px-1 font-mono">.env.local</code>.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 text-xs text-[color:var(--color-fg-dim)]">
          <div className="mb-1 font-medium text-[color:var(--color-fg)]">How it works</div>
          Every minute the server checks your active alerts against live market data. When an alert&apos;s
          conditions are all met, you get a Telegram push — instantly, even if the app is closed.
        </div>
      </div>
    </div>
  );
}
