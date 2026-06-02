const inbox = {
  inbox: "Inbox",
  markAllRead: "Mark all read",
  unreadLabel: "Unread",
  mentionsLabel: "Mentions",
  assignmentsLabel: "Assignments",
  noNotificationsYet: "No notifications yet",
  noNotificationsDesc: "Activity and mentions will appear here.",
  markRead: "Mark as read",
  notifType: "Type",
} as const;

export type InboxKeys = keyof typeof inbox;
export default inbox;
