const bugs = {
  bugTracker: "Bug Tracker",
  bugs: "Bugs",
  newBug: "New Bug",
  bugSeverity: "Severity",
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  openBugs: "Open Bugs",
  resolvedBugs: "Resolved",
  allBugs: "All Bugs",
  noBugsYet: "No bugs reported",
  noBugsDesc: "When bugs are reported they will appear here.",
  stepsToReproduce: "Steps to Reproduce",
  expectedBehavior: "Expected Behavior",
  actualBehavior: "Actual Behavior",
  bugDetails: "Bug Details",
  bugTab: "Bugs",
} as const;

export type BugsKeys = keyof typeof bugs;
export default bugs;
