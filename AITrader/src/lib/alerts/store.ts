import fs from "fs/promises";
import path from "path";
import type { AlertRule, AlertsDb } from "./types";

const DB_FILE = path.join(process.cwd(), "data", "alerts.json");

let cache: AlertsDb | null = null;
let writeLock: Promise<void> = Promise.resolve();

async function ensureDir() {
  await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
}

export async function readDb(): Promise<AlertsDb> {
  if (cache) return cache;
  await ensureDir();
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    cache = JSON.parse(raw) as AlertsDb;
    if (!Array.isArray(cache.rules)) cache = { rules: [] };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      cache = { rules: [] };
      await writeDb(cache);
    } else {
      throw err;
    }
  }
  return cache!;
}

async function writeDb(db: AlertsDb): Promise<void> {
  await ensureDir();
  const tmp = DB_FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DB_FILE);
  cache = db;
}

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = writeLock.then(fn);
  writeLock = next.then(() => undefined, () => undefined);
  return next;
}

export async function listRules(): Promise<AlertRule[]> {
  const db = await readDb();
  return [...db.rules].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getRule(id: string): Promise<AlertRule | undefined> {
  const db = await readDb();
  return db.rules.find((r) => r.id === id);
}

export async function createRule(rule: AlertRule): Promise<AlertRule> {
  return withLock(async () => {
    const db = await readDb();
    db.rules.push(rule);
    await writeDb(db);
    return rule;
  });
}

export async function updateRule(id: string, patch: Partial<AlertRule>): Promise<AlertRule | undefined> {
  return withLock(async () => {
    const db = await readDb();
    const idx = db.rules.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    db.rules[idx] = { ...db.rules[idx], ...patch, id: db.rules[idx].id };
    await writeDb(db);
    return db.rules[idx];
  });
}

export async function deleteRule(id: string): Promise<boolean> {
  return withLock(async () => {
    const db = await readDb();
    const before = db.rules.length;
    db.rules = db.rules.filter((r) => r.id !== id);
    if (db.rules.length === before) return false;
    await writeDb(db);
    return true;
  });
}
