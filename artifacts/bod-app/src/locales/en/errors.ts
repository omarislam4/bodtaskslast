const errors = {
  // Auth
  errInvalidCredentials: "Invalid email or password",
  errTooManyAttempts: "Too many attempts, try again later",
  errNetwork: "Network error — check your connection",
  errEmailTaken: "This email is already in use",
  errSignupFailed: "Failed to create account, please try again",
  // Profile & settings
  errSaveProfile: "Failed to save profile",
  errSaveSettings: "Failed to save settings",
  // Tasks
  errCreateTask: "Failed to create task",
  errUpdateTask: "Failed to update task",
  errDeleteTask: "Failed to delete task",
  errAddComment: "Failed to add comment",
  errAlreadyLinked: "Already linked",
  errNoPhoneSet: "No assignees have a phone number set",
  // Spaces
  errCreateSpace: "Failed to create space",
  errDeleteSpace: "Failed to delete space",
  errCreateSubSpace: "Failed to create sub-space",
  errAddMember: "Failed to add member",
  errRemoveMember: "Failed to remove member",
  errUpdateMember: "Failed to update member",
  // Goals / Sprints
  errCreateGoal: "Failed to create goal",
  errUpdateGoal: "Failed to update goal",
  errDeleteGoal: "Failed to delete goal",
  errCreateSprint: "Failed to create sprint",
  errUpdateSprint: "Failed to update sprint",
  errDeleteSprint: "Failed to delete sprint",
  // Other features
  errCreateChannel: "Failed to create channel",
  errDeleteChannel: "Failed to delete channel",
  errCreateAutomation: "Failed to create automation",
  errCreateForm: "Failed to create form",
  errReportBug: "Failed to report bug",
  errAddSender: "Failed to add sender",
  errUpdateSender: "Failed to update sender",
  errDeleteSender: "Failed to delete sender",
  errSendReport: "Failed to send report",
  errNoReport: "Please write a report before submitting",
  errReassign: "Failed to reassign",
  // Generic
  errGeneric: "Something went wrong, please try again",
} as const;

export type ErrorsKeys = keyof typeof errors;
export default errors;
