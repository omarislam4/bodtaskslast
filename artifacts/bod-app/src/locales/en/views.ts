const views = {
  // Kanban / Table / Gantt
  kanbanView: "Board",
  tableView: "Table",
  ganttView: "Gantt",
  // Calendar
  calendarView: "Calendar",
  monthView: "Month",
  weekView: "Week",
  dayView: "Day",
  noTasksOnDay: "No tasks",
  // Workload
  workloadView: "Workload",
  memberCapacity: "Capacity",
  overloaded: "Overloaded",
  underloaded: "Underloaded",
  balanced: "Balanced",
  hoursPerDay: "hrs/day",
  workloadTitle: "Workload View",
  setCapacity: "Set Capacity",
  // Portfolio
  portfolio: "Portfolio",
  projectHealth: "Project Health",
  noProjects: "No projects to display",
} as const;

export type ViewsKeys = keyof typeof views;
export default views;
