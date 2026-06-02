import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { goalsService } from "@/services/goals";
import { useLang } from "@/contexts/LangContext";
import { toast } from "sonner";
import type { CreateGoalPayload, UpdateGoalPayload } from "@/types";

export const goalKeys = {
  all: () => ["goals"] as const,
  bySpace: (spaceId: string) => ["goals", spaceId] as const,
};

export const useGoals = (spaceId?: string) =>
  useQuery({
    queryKey: spaceId ? goalKeys.bySpace(spaceId) : goalKeys.all(),
    queryFn: () => goalsService.list(spaceId),
  });

export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (payload: CreateGoalPayload) => goalsService.create(payload),
    onSuccess: (goal) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.bySpace(goal.spaceId) });
    },
    onError: () => toast.error(t.errCreateGoal),
  });
};

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateGoalPayload }) =>
      goalsService.update(id, payload),
    onSuccess: (goal) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.bySpace(goal.spaceId) });
    },
    onError: () => toast.error(t.errUpdateGoal),
  });
};

export const useDeleteGoal = () => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (id: string) => goalsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all() });
    },
    onError: () => toast.error(t.errDeleteGoal),
  });
};
