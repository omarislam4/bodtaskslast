import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsService } from "@/services/settings";
import { useLang } from "@/contexts/LangContext";
import { toast } from "sonner";
import type { UpdateAppSettingsPayload } from "@/types";

export const settingsKeys = {
  app: () => ["settings", "app"] as const,
};

export const useAppSettings = (enabled = false) =>
  useQuery({
    queryKey: settingsKeys.app(),
    queryFn: settingsService.getApp,
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

export const useUpdateAppSettings = () => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (payload: UpdateAppSettingsPayload) => settingsService.updateApp(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(settingsKeys.app(), updated);
      toast.success(t.webhookSettings);
    },
    onError: () => toast.error(t.errSaveSettings),
  });
};
