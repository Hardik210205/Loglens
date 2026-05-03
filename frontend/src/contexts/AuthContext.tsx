import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getToken, isAdmin, login as loginRequest, logout as clearAuth } from '../services/authApi';

interface AuthUser {
  id: string;
  email: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(getToken());
    setUser(getCurrentUser());
  }, []);

  const login = async (email: string, password: string) => {
    const result = await loginRequest(email, password);
    localStorage.setItem('ll_token', result.token);
    const decoded = getCurrentUser();

    if (decoded) {
      localStorage.setItem('ll_user', JSON.stringify(decoded));
      setUser(decoded);
    }

    setToken(result.token);
  };

  const logout = () => {
    clearAuth();
    setUser(null);
    setToken(null);
    navigate('/login');
  };

  const value: AuthContextValue = {
    user,
    token,
    login,
    logout,
    isAdmin,
    isAuthenticated: Boolean(token)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}