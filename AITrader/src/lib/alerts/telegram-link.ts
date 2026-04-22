interface PendingCode {
  createdAt: number;
}

const GLOBAL_KEY = "__signalforge_telegram_pending__";
type GlobalWithStore = typeof globalThis & { [GLOBAL_KEY]?: Map<string, PendingCode> };

function store(): Map<string, PendingCode> {
  const g = globalThis as GlobalWithStore;
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = new Map();
  return g[GLOBAL_KEY]!;
}

const TTL_MS = 15 * 60 * 1000;

function cleanup() {
  const now = Date.now();
  const s = store();
  for (const [code, pending] of s.entries()) {
    if (now - pending.createdAt > TTL_MS) s.delete(code);
  }
}

export function createLinkCode(): string {
  cleanup();
  const code = `sf${Math.random().toString(36).slice(2, 10)}`;
  store().set(code, { createdAt: Date.now() });
  return code;
}

export function hasLinkCode(code: string): boolean {
  cleanup();
  return store().has(code);
}

export function consumeLinkCode(code: string): boolean {
  cleanup();
  return store().delete(code);
}
