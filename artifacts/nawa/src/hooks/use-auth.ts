import { useState, useEffect, useCallback } from "react";
import { User } from "@workspace/api-client-react";
import { useLocation } from "wouter";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [, setLocation] = useLocation();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const loadAuth = () => {
      try {
        const storedToken = localStorage.getItem("nawa_token");
        const storedUser = localStorage.getItem("nawa_user");
        
        if (storedToken && storedUser) {
          setAuthState({
            user: JSON.parse(storedUser),
            token: storedToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error("Failed to parse auth state", error);
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };
    
    loadAuth();
    
    // Listen for storage changes from other tabs
    window.addEventListener("storage", loadAuth);
    return () => window.removeEventListener("storage", loadAuth);
  }, []);

  const login = useCallback((token: string, user: User) => {
    localStorage.setItem("nawa_token", token);
    localStorage.setItem("nawa_user", JSON.stringify(user));
    setAuthState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("nawa_token");
    localStorage.removeItem("nawa_user");
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    setLocation("/auth/login");
  }, [setLocation]);

  const hasRole = useCallback((roles: string[]) => {
    if (!authState.user) return false;
    return roles.includes(authState.user.role);
  }, [authState.user]);

  return {
    ...authState,
    login,
    logout,
    hasRole,
  };
}