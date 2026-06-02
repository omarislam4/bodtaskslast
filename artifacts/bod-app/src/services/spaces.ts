import api from "./api";
import type {
  Space, SpaceMember, SpaceDataItem,
  CreateSpacePayload, CreateSubSpacePayload,
  CreateSpaceDataItemPayload,
} from "@/types";

export const spacesService = {
  list: (): Promise<Space[]> =>
    api.get<Space[]>("/spaces").then((r) => r.data),

  get: (id: string): Promise<Space> =>
    api.get<Space>(`/spaces/${id}`).then((r) => r.data),

  create: (payload: CreateSpacePayload): Promise<Space> =>
    api.post<{ message: string; space: Space }>("/spaces", payload).then((r) => r.data.space),

  remove: (id: string): Promise<void> =>
    api.delete(`/spaces/${id}`).then(() => undefined),

  // Sub-spaces
  listSubSpaces: (spaceId: string): Promise<Space[]> =>
    api.get<Space[]>(`/spaces/${spaceId}/subspaces`).then((r) => r.data),

  createSubSpace: (spaceId: string, payload: CreateSubSpacePayload): Promise<Space> =>
    api
      .post<{ message: string; space: Space }>(`/spaces/${spaceId}/subspaces`, payload)
      .then((r) => r.data.space),

  // Members
  listMembers: (spaceId: string): Promise<SpaceMember[]> =>
    api.get<SpaceMember[]>(`/spaces/${spaceId}/members`).then((r) => r.data),

  addMember: (spaceId: string, userId: string): Promise<Space> =>
    api
      .post<{ message: string; space: Space }>(`/spaces/${spaceId}/members`, { userId })
      .then((r) => r.data.space),

  removeMember: (spaceId: string, memberId: string): Promise<Space> =>
    api
      .delete<{ message: string; space: Space }>(`/spaces/${spaceId}/members/${memberId}`)
      .then((r) => r.data.space),

  // Data items
  listDataItems: (spaceId: string): Promise<SpaceDataItem[]> =>
    api.get<SpaceDataItem[]>(`/spaces/${spaceId}/data-items`).then((r) => r.data),

  createDataItem: (spaceId: string, payload: CreateSpaceDataItemPayload): Promise<SpaceDataItem> =>
    api
      .post<{ message: string; item: SpaceDataItem }>(`/spaces/${spaceId}/data-items`, payload)
      .then((r) => r.data.item),

  deleteDataItem: (spaceId: string, itemId: string): Promise<void> =>
    api.delete(`/spaces/${spaceId}/data-items/${itemId}`).then(() => undefined),
};
