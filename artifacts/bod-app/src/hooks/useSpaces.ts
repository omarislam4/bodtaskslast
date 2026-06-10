import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { spacesService } from "@/services/spaces";
import { useLang } from "@/contexts/LangContext";
import { toast } from "sonner";
import type {
  CreateSpacePayload, CreateSubSpacePayload,
  CreateSpaceDataItemPayload,
} from "@/types";

export type { Space, SpaceMember, SpaceDataItem } from "@/types";

export const spaceKeys = {
  all: () => ["spaces"] as const,
  detail: (id: string) => ["space", id] as const,
  members: (id: string) => ["space", id, "members"] as const,
  subSpaces: (id: string) => ["space", id, "subspaces"] as const,
  dataItems: (id: string) => ["space", id, "data-items"] as const,
};

// ─── List ─────────────────────────────────────────────────────────────────────

export const useSpaces = () => {
  const query = useQuery({
    queryKey: spaceKeys.all(),
    queryFn: spacesService.list,
  });

  return {
    ...query,
    spaces: query.data ?? [],
    loading: query.isLoading,
  };
};

export const useSpaceQuery = (spaceId: string | undefined) =>
  useQuery({
    queryKey: spaceKeys.detail(spaceId ?? ""),
    queryFn: () => spacesService.get(spaceId!),
    enabled: !!spaceId,
  });

export const useSubSpaces = (spaceId: string | undefined) =>
  useQuery({
    queryKey: spaceKeys.subSpaces(spaceId ?? ""),
    queryFn: () => spacesService.listSubSpaces(spaceId!),
    enabled: !!spaceId,
  });

export const useSpaceMembers = (spaceId: string | undefined) =>
  useQuery({
    queryKey: spaceKeys.members(spaceId ?? ""),
    queryFn: () => spacesService.listMembers(spaceId!),
    enabled: !!spaceId,
  });

export const useSpaceDataItems = (spaceId: string | undefined) =>
  useQuery({
    queryKey: spaceKeys.dataItems(spaceId ?? ""),
    queryFn: () => spacesService.listDataItems(spaceId!),
    enabled: !!spaceId,
  });

// ─── Mutations ────────────────────────────────────────────────────────────────

export const useCreateSpace = () => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (payload: CreateSpacePayload) => spacesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: spaceKeys.all() });
      toast.success(t.spaceCreated);
    },
    onError: () => toast.error(t.errCreateSpace),
  });
};

export const useDeleteSpace = () => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (id: string) => spacesService.remove(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: spaceKeys.all() });
      queryClient.removeQueries({ queryKey: spaceKeys.detail(id) });
      toast.success(t.spaceDeleted);
    },
    onError: () => toast.error(t.errDeleteSpace),
  });
};

export const useCreateSubSpace = () => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: ({ spaceId, payload }: { spaceId: string; payload: CreateSubSpacePayload }) =>
      spacesService.createSubSpace(spaceId, payload),
    onSuccess: (_, { spaceId }) => {
      queryClient.invalidateQueries({ queryKey: spaceKeys.subSpaces(spaceId) });
      toast.success(t.subspaceCreated);
    },
    onError: () => toast.error(t.errCreateSubSpace),
  });
};

export const useAddSpaceMember = () => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: ({ spaceId, userId }: { spaceId: string; userId: string }) =>
      spacesService.addMember(spaceId, userId),
    onSuccess: (updatedSpace) => {
      queryClient.setQueryData(spaceKeys.detail(updatedSpace.id), updatedSpace);
      queryClient.invalidateQueries({ queryKey: spaceKeys.members(updatedSpace.id) });
      toast.success(t.memberAdded);
    },
    onError: () => toast.error(t.errAddMember),
  });
};

export const useAddSpaceMembers = () => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: ({ spaceId, userIds }: { spaceId: string; userIds: string[] }) =>
      Promise.allSettled(userIds.map((userId) => spacesService.addMember(spaceId, userId))),
    onSuccess: (results, { spaceId }) => {
      const failed = results.filter((r) => r.status === "rejected").length;
      const succeeded = results.length - failed;
      queryClient.invalidateQueries({ queryKey: spaceKeys.members(spaceId) });
      queryClient.invalidateQueries({ queryKey: spaceKeys.detail(spaceId) });
      if (failed === 0) {
        toast.success(succeeded === 1 ? t.memberAdded : `${succeeded} members added`);
      } else {
        toast.warning(`${succeeded} added, ${failed} failed`);
      }
    },
    onError: () => toast.error(t.errAddMember),
  });
};

export const useRemoveSpaceMember = () => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: ({ spaceId, memberId }: { spaceId: string; memberId: string }) =>
      spacesService.removeMember(spaceId, memberId),
    onSuccess: (updatedSpace) => {
      queryClient.setQueryData(spaceKeys.detail(updatedSpace.id), updatedSpace);
      queryClient.invalidateQueries({ queryKey: spaceKeys.members(updatedSpace.id) });
      toast.success(t.memberRemoved);
    },
    onError: () => toast.error(t.errRemoveMember),
  });
};

export const useCreateSpaceDataItem = () => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: ({ spaceId, payload }: { spaceId: string; payload: CreateSpaceDataItemPayload }) =>
      spacesService.createDataItem(spaceId, payload),
    onSuccess: (_, { spaceId }) => {
      queryClient.invalidateQueries({ queryKey: spaceKeys.dataItems(spaceId) });
      toast.success(t.dataItemAdded);
    },
    onError: () => toast.error(t.errGeneric),
  });
};

export const useDeleteSpaceDataItem = () => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: ({ spaceId, itemId }: { spaceId: string; itemId: string }) =>
      spacesService.deleteDataItem(spaceId, itemId),
    onSuccess: (_, { spaceId }) => {
      queryClient.invalidateQueries({ queryKey: spaceKeys.dataItems(spaceId) });
      toast.success(t.dataItemDeleted);
    },
    onError: () => toast.error(t.errGeneric),
  });
};
