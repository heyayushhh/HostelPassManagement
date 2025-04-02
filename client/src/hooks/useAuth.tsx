import React, { createContext, useContext, useState, ReactNode } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { login, logout, getUser, register } from "@/lib/auth";
import { User, LoginData, InsertUser } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginData) => Promise<void>;
  register: (data: InsertUser) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();

  // Get current user
  const { isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getUser
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: login
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: register
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: logout
  });

  const handleLogin = async (data: LoginData) => {
    await loginMutation.mutateAsync(data);
  };

  const handleRegister = async (data: InsertUser) => {
    await registerMutation.mutateAsync(data);
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
  };

  const contextValue = {
    user,
    isLoading: isLoading || loginMutation.isPending || logoutMutation.isPending,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}