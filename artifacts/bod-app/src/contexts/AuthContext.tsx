import React, { createContext, useContext, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { authKeys, useMe, useLogin, useRegister } from "@/hooks/useAuthQueries";
import type { UserDoc } from "@/types";

export type { UserDoc };
export { authKeys };

interface AuthContextType {
  userDoc: UserDoc | null;
  loading: boolean;
  isAdmin: boolean;
  loginPending: boolean;
  registerPending: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (displayName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  userDoc: null,
  loading: true,
  isAdmin: false,
  loginPending: false,
  registerPending: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const { data: userDoc = null, isLoading } = useMe(!!token);
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const login = async (email: string, password: string) => {
    const data = await loginMutation.mutateAsync({ email, password });
    localStorage.setItem("token", data.token);
    setToken(data.token);
    queryClient.setQueryData(authKeys.me(), data.user);
    navigate("/spaces");
  };

  const register = async (displayName: string, email: string, password: string) => {
    const data = await registerMutation.mutateAsync({ displayName, email, password });
    localStorage.setItem("token", data.token);
    setToken(data.token);
    queryClient.setQueryData(authKeys.me(), data.user);
    navigate("/spaces");
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    queryClient.removeQueries({ queryKey: authKeys.me() });
    navigate("/login");
  };

  const isAdmin = userDoc?.role === "admin";
  const loading = !!token && isLoading;

  return (
    <AuthContext.Provider value={{
      userDoc,
      loading,
      isAdmin,
      loginPending: loginMutation.isPending,
      registerPending: registerMutation.isPending,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
