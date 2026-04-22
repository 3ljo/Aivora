import type { AlertCondition, TradePlan } from "../types";

export type AlertStatus = "active" | "triggered" | "disabled";

export interface AlertRule {
  id: string;
  description: string;
  symbol: string;
  conditions: AlertCondition[];
  tradePlan?: TradePlan | null;
  status: AlertStatus;
  createdAt: string;
  lastCheckedAt?: string;
  triggeredAt?: string;
  triggerContext?: string;
}

export interface AlertsDb {
  rules: AlertRule[];
}
