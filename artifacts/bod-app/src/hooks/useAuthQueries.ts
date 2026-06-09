import { useQuery, useMutation } from "@tanstack/react-query";
import { AuthResponse, authService } from "@/services/auth";
import { useLocation } from "wouter";

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

export const useLogin = (onSuccess?: (data: AuthResponse) => void) => {
  const [, navigate] = useLocation();
  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      navigate("/spaces");
      if (onSuccess) onSuccess(data);
    },
  });
};
export const useRegister = (onSuccess?: (data: AuthResponse) => void) => {
  const [, navigate] = useLocation();
  return useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      navigate("/spaces");
      if (onSuccess) onSuccess(data);
    },
  });
};
