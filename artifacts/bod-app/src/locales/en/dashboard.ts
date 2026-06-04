const dashboard = {
  allCaughtUp: "All caught up!",
  noPendingTasks: "No pending tasks assigned to you.",
  notifications: "Notifications",
  viewAllTasks: "View all my tasks →",
  totalTasks: "Total Tasks",
  notAssigned: "Not Assigned",
  completion: "Completion",
  upcomingDeadlines: "Upcoming Deadlines",
  noDeadlinesSet: "No deadlines set",
  taskTimeline: "Task Timeline",
  teamMembers: "Team Members",
  noUpcomingDeadlines: "No upcoming deadlines",
  teamPerformance: "Team Performance",
  tasksByMember: "Tasks by Member",
  taskDistribution: "Task Distribution",
  completionRate: "Completion Rate",
  employeeStats: "Employee Statistics",
  activeTasks: "Active Tasks",
  viewSpaces: "View spaces",
  completedTasks: "Completed",
  noDataYet: "No data yet",
  viewAllSpaces: "View all spaces →",
  hereAreYourAssignedTasks: "Here are your assigned tasks",
} as const;

export type DashboardKeys = keyof typeof dashboard;
export default dashboard;
