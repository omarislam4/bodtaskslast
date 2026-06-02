import { useQuery, useMutation } from "@tanstack/react-query";
import { authService } from "@/services/auth";

export const authKeys = {
  me: () => ["auth", "me"] as const,
};

export const useMe = (enabled: boolean) =>
  useQuery({
    queryKey: authKeys.me(),
    queryFn: authService.me,
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

export const useLogin = () =>
  useMutation({ mutationFn: authService.login });

export const useRegister = () =>
  useMutation({ mutationFn: authService.register });
