export interface Space {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  memberIds: string[];
  parentSpaceId?: string | null;
  createdAt: string;
  createdBy: string;
}

export interface SpaceMember {
  id: string;
  name: string;
  email: string;
  displayName: string;
  role: "admin" | "member";
  avatar: string;
  phone: string;
  countryCode: string;
  shiftEnd: string;
  createdAt: string;
}

export interface SpaceDataItem {
  id: string;
  type: "folder" | "link";
  name: string;
  url: string;
  notes: string;
  parentId: string | null;
  createdAt: string;
  createdBy: string;
}

export interface CreateSpacePayload {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export type CreateSubSpacePayload = CreateSpacePayload;

export interface AddSpaceMemberPayload {
  userId: string;
}

export interface CreateSpaceDataItemPayload {
  type: "folder" | "link";
  name: string;
  url?: string;
  notes?: string;
  parentId?: string | null;
}
