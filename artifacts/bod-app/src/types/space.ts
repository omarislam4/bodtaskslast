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

export interface SpaceAttachment {
  id: string;
  spaceId: string;
  type: "file" | "screenshot" | "video" | "link";
  title?: string | null;
  url?: string | null;
  fileName?: string | null;
  originalName?: string | null;
  mimeType?: string | null;
  size?: number | null;
  uploadedBy?: string | null;
  uploadedByName?: string | null;
  createdAt?: string;
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
