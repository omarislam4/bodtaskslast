import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersService } from "@/services/users";
import { authKeys } from "@/hooks/useAuthQueries";
import { useLang } from "@/contexts/LangContext";
import { toast } from "sonner";
import type { UpdateProfilePayload } from "@/types";

export const userKeys = {
  me: () => ["user", "me"] as const,
};

export const useUpdateProfile = (userId: string) => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => usersService.updateProfile(userId, payload),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(authKeys.me(), updatedUser);
      toast.success(t.saveChanges);
    },
    onError: () => toast.error(t.errSaveProfile),
  });
};
