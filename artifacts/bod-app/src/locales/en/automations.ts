const automations = {
  automations: "Automations",
  newAutomation: "New Automation",
  createAutomation: "Create Automation",
  automationName: "Automation Name",
  triggerLabel: "Trigger — When",
  conditionLabel: "Condition — If",
  actionLabel: "Action — Then",
  noAutomations: "No automations yet",
  noAutomationsDesc: "Automate repetitive work with simple if-then rules.",
  enabledLabel: "Enabled",
  automationRuns: "Runs",
  whenStatusChanges: "Status changes to",
  whenPriorityChanges: "Priority changes to",
  whenAssigneeAdded: "Assignee is added",
  whenTaskCreated: "Task is created",
  whenDueDateReaches: "Due date reaches",
  thenChangeStatus: "Change status to",
  thenChangePriority: "Change priority to",
  thenAssign: "Assign to member",
  thenNotify: "Send notification",
  thenCreateTask: "Create a new task",
} as const;

export type AutomationsKeys = keyof typeof automations;
export default automations;
