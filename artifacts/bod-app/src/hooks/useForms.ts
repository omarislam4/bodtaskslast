import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formsService } from "@/services/forms";
import { useLang } from "@/contexts/LangContext";
import { toast } from "sonner";

export type FormFieldType = "text" | "number" | "date" | "dropdown" | "checkbox" | "email";

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  options?: string[];
}

export interface Form {
  id: string;
  title: string;
  description: string;
  spaceId: string;
  fields: FormField[];
  submissionCount: number;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
}

export interface CreateFormPayload {
  title: string;
  description?: string;
  spaceId?: string;
  fields?: FormField[];
  isPublic?: boolean;
  createdBy?: string;
}

export const formKeys = {
  all: () => ["forms"] as const,
};

export const useForms = () => {
  const query = useQuery({
    queryKey: formKeys.all(),
    queryFn: formsService.list,
  });

  return {
    forms: query.data ?? [],
    loading: query.isLoading,
  };
};

export const useCreateForm = () => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (payload: CreateFormPayload) => formsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formKeys.all() });
      toast.success(t.createForm);
    },
    onError: () => toast.error(t.errGeneric),
  });
};

export const useDeleteForm = () => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (id: string) => formsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formKeys.all() });
      toast.success(t.delete);
    },
    onError: () => toast.error(t.errGeneric),
  });
};
