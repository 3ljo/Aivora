import { evaluateRule } from "./evaluator";
import { dispatchTrigger } from "./channels/dispatch";
import { listRules, updateRule } from "./store";

export async function tickOnce(): Promise<{ checked: number; fired: number; errors: string[] }> {
  const rules = (await listRules()).filter((r) => r.status === "active");
  const errors: string[] = [];
  let fired = 0;

  for (const rule of rules) {
    try {
      const { triggered, context, price } = await evaluateRule(rule);
      await updateRule(rule.id, {
        lastCheckedAt: new Date().toISOString(),
      });

      if (triggered) {
        const stamped = new Date().toISOString();
        await updateRule(rule.id, {
          status: "triggered",
          triggeredAt: stamped,
          triggerContext: context,
        });
        const dispatch = await dispatchTrigger(rule, { price, context });
        if (dispatch.telegram && !dispatch.telegram.ok) errors.push(`telegram: ${dispatch.telegram.error}`);
        fired++;
      }
    } catch (err) {
      errors.push(`${rule.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { checked: rules.length, fired, errors };
}

const GLOBAL_KEY = "__signalforge_monitor_interval__";
type GlobalWithMonitor = typeof globalThis & { [GLOBAL_KEY]?: NodeJS.Timeout };

export function startMonitor(intervalMs = 60_000) {
  const g = globalThis as GlobalWithMonitor;
  if (g[GLOBAL_KEY]) {
    clearInterval(g[GLOBAL_KEY]);
  }
  g[GLOBAL_KEY] = setInterval(() => {
    tickOnce().catch((err) => {
      console.error("[alerts monitor] tick failed:", err);
    });
  }, intervalMs);
  console.log(`[alerts monitor] started — polling every ${intervalMs / 1000}s`);
}
