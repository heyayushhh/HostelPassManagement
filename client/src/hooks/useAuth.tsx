import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, QueryClient } from "@tanstack/react-query";
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
  const { isLoading, data: userData } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getUser,
  });

  // Initialize user from query data
  useEffect(() => {
    if (userData && userData.user) {
      setUser(userData.user);
    }
  }, [userData]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      if (data && data.user) {
        setUser(data.user);
        // Redirect based on user role
        if (data.user.role === 'student') {
          navigate('/student/dashboard');
        } else if (data.user.role === 'warden') {
          navigate('/warden/dashboard');
        } else if (data.user.role === 'guard') {
          navigate('/guard/dashboard');
        }
      }
    },
    onError: (error: any) => {
      setError(error.message || 'Login failed');
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: () => {
      navigate('/'); // Redirect to login page after registration
    },
    onError: (error: any) => {
      setError(error.message || 'Registration failed');
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      setUser(null);
      navigate('/');
      // Invalidate queries to reset state
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    }
  });

  const handleLogin = async (data: LoginData) => {
    setError(null);
    try {
      await loginMutation.mutateAsync(data);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  const handleRegister = async (data: InsertUser) => {
    setError(null);
    try {
      await registerMutation.mutateAsync(data);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (err: any) {
      console.error('Logout failed:', err);
    }
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