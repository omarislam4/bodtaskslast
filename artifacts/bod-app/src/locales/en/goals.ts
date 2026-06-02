const goals = {
  goals: "Goals",
  newGoal: "New Goal",
  createGoal: "Create Goal",
  goalTitle: "Goal Title",
  goalDescription: "Goal Description",
  targetValue: "Target Value",
  currentValue: "Current Value",
  goalType: "Goal Type",
  numberGoal: "Number",
  percentGoal: "Percentage (%)",
  booleanGoal: "True / False",
  currencyGoal: "Currency",
  noGoals: "No goals yet",
  noGoalsDesc: "Create goals to track your team's biggest targets.",
  goalProgress: "Goal Progress",
  onTrack: "On Track",
  atRisk: "At Risk",
  offTrack: "Off Track",
  goalFolders: "Folders",
  updateProgress: "Update Progress",
  linkTasks: "Link Tasks",
  goalStatus: "Status",
} as const;

export type GoalsKeys = keyof typeof goals;
export default goals;
