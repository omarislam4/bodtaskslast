export interface Automation {
  id: string;
  name: string;
  triggerType: string;
  triggerValue: string;
  conditionType?: string | null;
  conditionValue?: string | null;
  actionType: string;
  actionValue: string;
  enabled: boolean;
  runCount: number;
  createdBy: string;
  createdAt: string;
  lastRunAt?: string | null;
}

export interface CreateAutomationPayload {
  name: string;
  triggerType: string;
  triggerValue: string;
  conditionType?: string | null;
  conditionValue?: string | null;
  actionType: string;
  actionValue: string;
}

export interface UpdateAutomationPayload {
  enabled?: boolean;
  name?: string;
  triggerType?: string;
  triggerValue?: string;
  actionType?: string;
  actionValue?: string;
}
