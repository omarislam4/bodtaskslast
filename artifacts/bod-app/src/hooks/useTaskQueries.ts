import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { tasksService } from "@/services/tasks";
import { useLang } from "@/contexts/LangContext";
import { toast } from "sonner";
import type {
  Task,
  CreateTaskPayload,
  UpdateTaskPayload,
  TaskQueryParams,
  DependencyType,
} from "@/types";
import { taskKeys } from "./taskKeys";
import {
  setTaskDetail,
  applyTaskPatch,
  applySubtaskPatch,
  removeSubtask,
  applyChecklistPatch,
  removeChecklistItem,
  applyWatcherAdd,
  applyWatcherRemove,
  removeTaskTag,
  invalidateTaskDetail,
  invalidateTaskList,
} from "./taskCache";

export { taskKeys };

// ─── Queries ──────────────────────────────────────────────────────────────────

export const useAllTasksQuery = (params?: TaskQueryParams) =>
  useQuery({
    queryKey: taskKeys.all(params),
    queryFn: () => tasksService.list(params),
  });

export const useAllTasksInfiniteQuery = (params?: TaskQueryParams) =>
  useInfiniteQuery({
    queryKey: taskKeys.allInfinite(params),
    queryFn: ({ pageParam }) =>
      tasksService.listPaginated({ ...params, page: pageParam, perPage: 20 }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.lastPage
        ? lastPage.meta.page + 1
        : undefined,
    initialPageParam: 1,
  });

export const useMyTasksQuery = (params?: {
  scope?: "today" | "overdue" | "upcoming" | "all";
  search?: string;
}) =>
  useQuery({
    queryKey: taskKeys.myTasks(params),
    queryFn: () => tasksService.myTasks(params),
  });

export const useMyTasksInfiniteQuery = (params?: {
  scope?: "today" | "overdue" | "upcoming" | "all";
  search?: string;
}) =>
  useInfiniteQuery({
    queryKey: taskKeys.myTasksInfinite(params),
    queryFn: ({ pageParam }) =>
      tasksService.myTasksPaginated({
        ...params,
        page: pageParam,
        perPage: 20,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.lastPage
        ? lastPage.meta.page + 1
        : undefined,
    initialPageParam: 1,
    placeholderData: (prevData) => prevData,
  });

export const useTimelineQuery = (month: string) =>
  useQuery({
    queryKey: taskKeys.timeline(month),
    queryFn: () => tasksService.timeline(month),
    enabled: !!month,
  });

export const useHistoryQuery = (params?: {
  search?: string;
  priority?: string;
}) =>
  useQuery({
    queryKey: taskKeys.history(params),
    queryFn: () => tasksService.history(params),
  });

export const useHistoryInfiniteQuery = (params?: {
  search?: string;
  priority?: string;
}) =>
  useInfiniteQuery({
    queryKey: taskKeys.historyInfinite(params),
    queryFn: ({ pageParam }) =>
      tasksService.historyPaginated({
        ...params,
        page: pageParam,
        perPage: 20,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.lastPage
        ? lastPage.meta.page + 1
        : undefined,
    initialPageParam: 1,
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

// ─── Task CRUD ────────────────────────────────────────────────────────────────

export const useCreateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => tasksService.create(payload),
    onSuccess: (task) => {
      invalidateTaskList(qc, task.spaceId);
      invalidateTaskList(qc);
    },
  });
};

export const useUpdateTask = (id: string) => {
  const qc = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (payload: UpdateTaskPayload) =>
      tasksService.update(id, payload),
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: taskKeys.detail(id) });
      const previous = applyTaskPatch(qc, id, payload);
      return { previous };
    },
    onSuccess: (task) => {
      setTaskDetail(qc, id, task);
      invalidateTaskList(qc, task.spaceId);
    },
    onError: (_err, _vars, context) => {
      if (context?.previous)
        qc.setQueryData(taskKeys.detail(id), context.previous);
      toast.error(t.errUpdateTask);
    },
  });
};

export const useDeleteTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksService.remove(id),
    onSuccess: () => invalidateTaskList(qc),
  });
};

// ─── Comments ─────────────────────────────────────────────────────────────────

export const useAddComment = (taskId: string) => {
  const qc = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (payload: { text: string; mentions?: string[] }) =>
      tasksService.addComment(taskId, payload),
    onSuccess: () => invalidateTaskDetail(qc, taskId),
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

// ─── Checklist ────────────────────────────────────────────────────────────────

export const useAddChecklistItem = (taskId: string) => {
  const qc = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (payload: { text: string; assigneeId?: string }) =>
      tasksService.addChecklistItem(taskId, payload),
    onSuccess: () => invalidateTaskDetail(qc, taskId),
    onError: () => toast.error(t.errUpdateTask),
  });
};

export const useUpdateChecklistItem = (taskId: string) => {
  const qc = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: ({
      itemId,
      payload,
    }: {
      itemId: string;
      payload: { done?: boolean; text?: string };
    }) => tasksService.updateChecklistItem(taskId, itemId, payload),
    onMutate: async ({ itemId, payload }) => {
      await qc.cancelQueries({ queryKey: taskKeys.detail(taskId) });
      const previous = applyChecklistPatch(qc, taskId, itemId, payload);
      return { previous };
    },
    onSuccess: () => invalidateTaskDetail(qc, taskId),
    onError: (_err, _vars, context) => {
      if (context?.previous)
        qc.setQueryData(taskKeys.detail(taskId), context.previous);
      toast.error(t.errUpdateTask);
    },
  });
};

export const useDeleteChecklistItem = (taskId: string) => {
  const qc = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (itemId: string) =>
      tasksService.deleteChecklistItem(taskId, itemId),
    onMutate: async (itemId) => {
      await qc.cancelQueries({ queryKey: taskKeys.detail(taskId) });
      const previous = removeChecklistItem(qc, taskId, itemId);
      return { previous };
    },
    onSuccess: () => invalidateTaskDetail(qc, taskId),
    onError: (_err, _vars, context) => {
      if (context?.previous)
        qc.setQueryData(taskKeys.detail(taskId), context.previous);
      toast.error(t.errUpdateTask);
    },
  });
};

// ─── Subtasks ─────────────────────────────────────────────────────────────────

export const useAddSubtask = (taskId: string) => {
  const qc = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (payload: { title: string }) =>
      tasksService.addSubtask(taskId, payload),
    onSuccess: () => invalidateTaskDetail(qc, taskId),
    onError: () => toast.error(t.errUpdateTask),
  });
};

export const useUpdateSubtask = (taskId: string) => {
  const qc = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: ({
      subtaskId,
      payload,
    }: {
      subtaskId: string;
      payload: { status?: string; title?: string };
    }) => tasksService.updateSubtask(taskId, subtaskId, payload),
    onMutate: async ({ subtaskId, payload }) => {
      await qc.cancelQueries({ queryKey: taskKeys.detail(taskId) });
      const previous = applySubtaskPatch(
        qc,
        taskId,
        subtaskId,
        payload as { status?: Task["status"]; title?: string },
      );
      return { previous };
    },
    onSuccess: () => invalidateTaskDetail(qc, taskId),
    onError: (_err, _vars, context) => {
      if (context?.previous)
        qc.setQueryData(taskKeys.detail(taskId), context.previous);
      toast.error(t.errUpdateTask);
    },
  });
};

export const useDeleteSubtask = (taskId: string) => {
  const qc = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (subtaskId: string) =>
      tasksService.deleteSubtask(taskId, subtaskId),
    onMutate: async (subtaskId) => {
      await qc.cancelQueries({ queryKey: taskKeys.detail(taskId) });
      const previous = removeSubtask(qc, taskId, subtaskId);
      return { previous };
    },
    onSuccess: () => invalidateTaskDetail(qc, taskId),
    onError: (_err, _vars, context) => {
      if (context?.previous)
        qc.setQueryData(taskKeys.detail(taskId), context.previous);
      toast.error(t.errUpdateTask);
    },
  });
};

// ─── Time entries ─────────────────────────────────────────────────────────────

export const useAddTimeEntry = (taskId: string) => {
  const qc = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (payload: {
      duration: number;
      note?: string;
      billable?: boolean;
      startTime?: number;
      endTime?: number;
    }) => tasksService.addTimeEntry(taskId, payload),
    onSuccess: () => invalidateTaskDetail(qc, taskId),
    onError: () => toast.error(t.errUpdateTask),
  });
};

export const useDeleteTimeEntry = (taskId: string) => {
  const qc = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (entryId: string) =>
      tasksService.deleteTimeEntry(taskId, entryId),
    onSuccess: () => invalidateTaskDetail(qc, taskId),
    onError: () => toast.error(t.errUpdateTask),
  });
};

// ─── Dependencies ─────────────────────────────────────────────────────────────

export const useAddDependency = (taskId: string) => {
  const qc = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (payload: { taskId: string; type: DependencyType }) =>
      tasksService.addDependency(taskId, payload),
    onSuccess: () => invalidateTaskDetail(qc, taskId),
    onError: () => toast.error(t.errUpdateTask),
  });
};

export const useDeleteDependency = (taskId: string) => {
  const qc = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (depTaskId: string) =>
      tasksService.deleteDependency(taskId, depTaskId),
    onSuccess: () => invalidateTaskDetail(qc, taskId),
    onError: () => toast.error(t.errUpdateTask),
  });
};

// ─── Tags ─────────────────────────────────────────────────────────────────────

export const useAddTag = (taskId: string) => {
  const qc = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (tag: string) => tasksService.addTag(taskId, { tag }),
    onSuccess: () => invalidateTaskDetail(qc, taskId),
    onError: () => toast.error(t.errUpdateTask),
  });
};

export const useDeleteTag = (taskId: string) => {
  const qc = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (tag: string) => tasksService.deleteTag(taskId, tag),
    onMutate: async (tag) => {
      await qc.cancelQueries({ queryKey: taskKeys.detail(taskId) });
      const previous = removeTaskTag(qc, taskId, tag);
      return { previous };
    },
    onSuccess: () => invalidateTaskDetail(qc, taskId),
    onError: (_err, _vars, context) => {
      if (context?.previous)
        qc.setQueryData(taskKeys.detail(taskId), context.previous);
      toast.error(t.errUpdateTask);
    },
  });
};

// ─── Watchers ─────────────────────────────────────────────────────────────────

export const useAddWatcher = (taskId: string) => {
  const qc = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (userId: string) => tasksService.addWatcher(taskId, { userId }),
    onMutate: async (userId) => {
      await qc.cancelQueries({ queryKey: taskKeys.detail(taskId) });
      const previous = applyWatcherAdd(qc, taskId, userId);
      return { previous };
    },
    onSuccess: () => invalidateTaskDetail(qc, taskId),
    onError: (_err, _vars, context) => {
      if (context?.previous)
        qc.setQueryData(taskKeys.detail(taskId), context.previous);
      toast.error(t.errUpdateTask);
    },
  });
};

export const useRemoveWatcher = (taskId: string) => {
  const qc = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (userId: string) => tasksService.removeWatcher(taskId, userId),
    onMutate: async (userId) => {
      await qc.cancelQueries({ queryKey: taskKeys.detail(taskId) });
      const previous = applyWatcherRemove(qc, taskId, userId);
      return { previous };
    },
    onSuccess: () => invalidateTaskDetail(qc, taskId),
    onError: (_err, _vars, context) => {
      if (context?.previous)
        qc.setQueryData(taskKeys.detail(taskId), context.previous);
      toast.error(t.errUpdateTask);
    },
  });
};
