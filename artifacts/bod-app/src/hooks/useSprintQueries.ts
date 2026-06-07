import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sprintsService } from "@/services/sprints";
import { useLang } from "@/contexts/LangContext";
import { toast } from "sonner";
import type { CreateSprintPayload, UpdateSprintPayload } from "@/types";

export const sprintKeys = {
  all: () => ["sprints"] as const,
  bySpace: (spaceId: string) => ["sprints", spaceId] as const,
  infinite: (spaceId?: string) => ["sprints-infinite", spaceId] as const,
};

export const useSprints = (spaceId?: string) =>
  useQuery({
    queryKey: spaceId ? sprintKeys.bySpace(spaceId) : sprintKeys.all(),
    queryFn: () => sprintsService.list(spaceId),
  });

export const useSprintsInfiniteQuery = (spaceId?: string) =>
  useInfiniteQuery({
    queryKey: sprintKeys.infinite(spaceId),
    queryFn: ({ pageParam }) =>
      sprintsService.listPaginated({ spaceId, page: pageParam, perPage: 20 }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.lastPage ? lastPage.meta.page + 1 : undefined,
    initialPageParam: 1,
  });

export const useCreateSprint = () => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (payload: CreateSprintPayload) => sprintsService.create(payload),
    onSuccess: (sprint) => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.bySpace(sprint.spaceId) });
    },
    onError: () => toast.error(t.errCreateSprint),
  });
};

export const useUpdateSprint = () => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSprintPayload }) =>
      sprintsService.update(id, payload),
    onSuccess: (sprint) => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.bySpace(sprint.spaceId) });
    },
    onError: () => toast.error(t.errUpdateSprint),
  });
};

export const useDeleteSprint = () => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (id: string) => sprintsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.all() });
    },
    onError: () => toast.error(t.errDeleteSprint),
  });
};

export const useAddTaskToSprint = () => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: ({ sprintId, taskId }: { sprintId: string; taskId: string }) =>
      sprintsService.addTask(sprintId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.all() });
    },
    onError: () => toast.error(t.errUpdateSprint),
  });
};

export const useRemoveTaskFromSprint = () => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: ({ sprintId, taskId }: { sprintId: string; taskId: string }) =>
      sprintsService.removeTask(sprintId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.all() });
    },
    onError: () => toast.error(t.errUpdateSprint),
  });
};
