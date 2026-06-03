import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardService, type ReassignPayload } from "@/services/dashboard";
import { taskKeys } from "@/hooks/useTaskQueries";

export const dashboardKeys = {
  all: () => ["dashboard"] as const,
  filtered: (performanceSpaceId?: string) =>
    ["dashboard", { performanceSpaceId }] as const,
};

export const useDashboard = (performanceSpaceId?: string) =>
  useQuery({
    queryKey: dashboardKeys.filtered(performanceSpaceId),
    queryFn: () =>
      dashboardService.get(
        performanceSpaceId && performanceSpaceId !== "all"
          ? { performanceSpaceId }
          : undefined
      ),
  });

export const useReassignTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: ReassignPayload }) =>
      dashboardService.reassign(taskId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all() });
      queryClient.invalidateQueries({ queryKey: taskKeys.all() });
    },
  });
};
