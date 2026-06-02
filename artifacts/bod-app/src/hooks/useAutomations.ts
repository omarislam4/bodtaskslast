import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { automationsService } from "@/services/automations";
import { useLang } from "@/contexts/LangContext";
import { toast } from "sonner";
import type { CreateAutomationPayload, UpdateAutomationPayload } from "@/types";

export const automationKeys = {
  all: () => ["automations"] as const,
};

export const useAutomations = () =>
  useQuery({
    queryKey: automationKeys.all(),
    queryFn: automationsService.list,
  });

export const useCreateAutomation = () => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (payload: CreateAutomationPayload) => automationsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: automationKeys.all() });
      toast.success(t.automationCreated);
    },
    onError: () => toast.error(t.errCreateAutomation),
  });
};

export const useUpdateAutomation = () => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAutomationPayload }) =>
      automationsService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: automationKeys.all() });
    },
    onError: () => toast.error(t.errGeneric),
  });
};

export const useDeleteAutomation = () => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (id: string) => automationsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: automationKeys.all() });
      toast.success(t.automationDeleted);
    },
    onError: () => toast.error(t.errGeneric),
  });
};
