import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksService } from "@/services/tasks";
import { useLang } from "@/contexts/LangContext";
import { toast } from "sonner";
import type { CreateTaskPayload, UpdateTaskPayload, TaskQueryParams, DependencyType } from "@/types";

export const taskKeys = {
  all: (params?: TaskQueryParams) =>
    params ? (["tasks", params] as const) : (["tasks"] as const),
  detail: (id: string) => ["task", id] as const,
};

export const useAllTasksQuery = () =>
  useQuery({
    queryKey: taskKeys.all(),
    queryFn: () => tasksService.list(),
  });

export const useTasksBySpace = (spaceId: string) =>
  useQuery({
    queryKey: taskKeys.all({ spaceId }),
    queryFn: () => tasksService.list({ spaceId }),
    enabled: !!spaceId,
  });

export const useTaskQuery = (id: string) =>
  useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => tasksService.get(id),
    enabled: !!id,
  });

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => tasksService.create(payload),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all({ spaceId: task.spaceId }) });
      queryClient.invalidateQueries({ queryKey: taskKeys.all() });
    },
  });
};

export const useUpdateTask = (id: string) => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (payload: UpdateTaskPayload) => tasksService.update(id, payload),
    onSuccess: (task) => {
      queryClient.setQueryData(taskKeys.detail(id), task);
      queryClient.invalidateQueries({ queryKey: taskKeys.all({ spaceId: task.spaceId }) });
    },
    onError: () => toast.error(t.errUpdateTask),
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all() });
    },
  });
};

// ─── Task Detail Sub-resources ─────────────────────────────────────────────────

export const useAddComment = (taskId: string) => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (payload: { text: string; mentions?: string[] }) =>
      tasksService.addComment(taskId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
    onError: () => toast.error(t.errAddComment),
  });
};

export const useSendReminder = (taskId: string) => {
  const { t } = useLang();
  return useMutation({
    mutationFn: (payload: { target: string }) =>
      tasksService.sendReminder(taskId, payload),
    onError: () => toast.error(t.errGeneric),
  });
};

export const useAddChecklistItem = (taskId: string) => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (payload: { text: string; assigneeId?: string }) =>
      tasksService.addChecklistItem(taskId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
    onError: () => toast.error(t.errUpdateTask),
  });
};

export const useUpdateChecklistItem = (taskId: string) => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: { done?: boolean; text?: string } }) =>
      tasksService.updateChecklistItem(taskId, itemId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
    onError: () => toast.error(t.errUpdateTask),
  });
};

export const useDeleteChecklistItem = (taskId: string) => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (itemId: string) =>
      tasksService.deleteChecklistItem(taskId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
    onError: () => toast.error(t.errUpdateTask),
  });
};

export const useAddSubtask = (taskId: string) => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (payload: { title: string }) =>
      tasksService.addSubtask(taskId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
    onError: () => toast.error(t.errUpdateTask),
  });
};

export const useUpdateSubtask = (taskId: string) => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: ({ subtaskId, payload }: { subtaskId: string; payload: { status?: string; title?: string } }) =>
      tasksService.updateSubtask(taskId, subtaskId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
    onError: () => toast.error(t.errUpdateTask),
  });
};

export const useDeleteSubtask = (taskId: string) => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (subtaskId: string) =>
      tasksService.deleteSubtask(taskId, subtaskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
    onError: () => toast.error(t.errUpdateTask),
  });
};

export const useAddTimeEntry = (taskId: string) => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (payload: {
      duration: number;
      note?: string;
      billable?: boolean;
      startTime?: number;
      endTime?: number;
    }) => tasksService.addTimeEntry(taskId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
    onError: () => toast.error(t.errUpdateTask),
  });
};

export const useDeleteTimeEntry = (taskId: string) => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (entryId: string) => tasksService.deleteTimeEntry(taskId, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
    onError: () => toast.error(t.errUpdateTask),
  });
};

export const useAddDependency = (taskId: string) => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (payload: { taskId: string; type: DependencyType }) =>
      tasksService.addDependency(taskId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
    onError: () => toast.error(t.errUpdateTask),
  });
};

export const useDeleteDependency = (taskId: string) => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (depTaskId: string) =>
      tasksService.deleteDependency(taskId, depTaskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
    onError: () => toast.error(t.errUpdateTask),
  });
};

export const useAddTag = (taskId: string) => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (tag: string) => tasksService.addTag(taskId, { tag }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
    onError: () => toast.error(t.errUpdateTask),
  });
};

export const useDeleteTag = (taskId: string) => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (tag: string) => tasksService.deleteTag(taskId, tag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
    onError: () => toast.error(t.errUpdateTask),
  });
};

export const useAddWatcher = (taskId: string) => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (userId: string) => tasksService.addWatcher(taskId, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
    onError: () => toast.error(t.errUpdateTask),
  });
};

export const useRemoveWatcher = (taskId: string) => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (userId: string) => tasksService.removeWatcher(taskId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
    onError: () => toast.error(t.errUpdateTask),
  });
};
