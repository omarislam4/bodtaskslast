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
  login: (email: string, password: string) => void;
  register: (displayName: string, email: string, password: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  userDoc: null,
  loading: true,
  isAdmin: false,
  loginPending: false,
  registerPending: false,
  login: () => {},
  register: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token"),
  );
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const { data: userDoc = null, isLoading } = useMe(!!token);

  const loginMutation = useLogin((data) => {
    localStorage.setItem("token", data.token);
    setToken(data.token);
    queryClient.setQueryData(authKeys.me(), data.user);
  });

  const registerMutation = useRegister((data) => {
    localStorage.setItem("token", data.token);
    setToken(data.token);
    queryClient.setQueryData(authKeys.me(), data.user);
    navigate("/spaces");
  });

  const login = (email: string, password: string) =>
    loginMutation.mutate({ email, password });

  const register = (displayName: string, email: string, password: string) => {
    registerMutation.mutate({
      displayName,
      email,
      password,
    });
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
    <AuthContext.Provider
      value={{
        userDoc,
        loading,
        isAdmin,
        loginPending: loginMutation.isPending,
        registerPending: registerMutation.isPending,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
