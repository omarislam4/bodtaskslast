import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sendersService } from "@/services/senders";
import { useLang } from "@/contexts/LangContext";
import { toast } from "sonner";

export interface Sender {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  createdAt: string;
}

export interface CreateSenderPayload {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
}

export const senderKeys = {
  all: () => ["senders"] as const,
};

export const useSenders = () => {
  const query = useQuery({
    queryKey: senderKeys.all(),
    queryFn: sendersService.list,
  });

  return {
    senders: query.data ?? [],
    loading: query.isLoading,
  };
};

export const useCreateSender = () => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (payload: CreateSenderPayload) => sendersService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: senderKeys.all() });
      toast.success(t.addSenderTitle);
    },
    onError: () => toast.error(t.errGeneric),
  });
};

export const useUpdateSender = () => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateSenderPayload> }) =>
      sendersService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: senderKeys.all() });
      toast.success(t.save);
    },
    onError: () => toast.error(t.errGeneric),
  });
};

export const useDeleteSender = () => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (id: string) => sendersService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: senderKeys.all() });
      toast.success(t.delete);
    },
    onError: () => toast.error(t.errGeneric),
  });
};
