const sprints = {
  sprints: "Sprints",
  newSprint: "New Sprint",
  createSprint: "Create Sprint",
  sprintName: "Sprint Name",
  sprintGoal: "Sprint Goal",
  sprintStart: "Start Date",
  sprintEnd: "End Date",
  backlog: "Backlog",
  activeSprint: "Active Sprint",
  completeSprint: "Complete Sprint",
  addToSprint: "Add to Sprint",
  moveToBacklog: "Move to Backlog",
  sprintPoints: "Points",
  noSprints: "No sprints yet",
  noSprintsDesc: "Create your first sprint to organize your work into iterations.",
  sprintCompleted: "Completed",
  planningSprint: "Planning",
  activeSprnt: "Active",
  sprintBurndown: "Burndown",
  velocity: "Velocity",
} as const;

export type SprintsKeys = keyof typeof sprints;
export default sprints;
