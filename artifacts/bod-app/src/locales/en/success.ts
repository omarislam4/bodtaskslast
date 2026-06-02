const success = {
  spaceCreated: "Space created!",
  spaceDeleted: "Space deleted",
  subspaceCreated: "Sub-space created!",
  memberAdded: "Member added",
  memberRemoved: "Member removed",
  dataItemAdded: "Item added",
  dataItemDeleted: "Deleted",
  automationCreated: "Automation created!",
  automationDeleted: "Automation deleted!",
} as const;

export type SuccessKeys = keyof typeof success;
export default success;
