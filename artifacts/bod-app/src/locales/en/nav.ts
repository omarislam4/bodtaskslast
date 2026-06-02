const nav = {
  dashboard: "Dashboard",
  spaces: "Spaces",
  timeline: "Timeline",
  history: "History",
  members: "Members",
  senders: "Senders",
  settings: "Settings",
  menu: "Menu",
  workspace: "Workspace",
  lightMode: "Light mode",
  darkMode: "Dark mode",
  mySpaces: "My Spaces",
  attendance: "Attendance",
  weeklyReport: "Weekly Report",
} as const;

export type NavKeys = keyof typeof nav;
export default nav;
