const mytasks = {
  myTasks: "My Tasks",
  todayLabel: "Today",
  upcomingLabel: "Upcoming",
  overdueLabel: "Overdue",
  allTasksLabel: "All",
  noMyTasks: "You have no tasks",
  noMyTasksDesc: "Tasks assigned to you will appear here.",
} as const;

export type MyTasksKeys = keyof typeof mytasks;
export default mytasks;
