import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { authenticateUser } from '../utils/credentials';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'teacher' | 'admin';
  classId?: number; // undefined for admin (has access to all)
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    // Restore user from localStorage if available
    const stored = localStorage.getItem('authUser');
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Authenticate against credentials database
      const credential = authenticateUser(email, password);
      
      if (!credential) {
        throw new Error('Invalid email or password');
      }

      // Create user object with classId for teachers
      const authUser: AuthUser = {
        id: credential.email,
        email: credential.email,
        name: credential.name,
        role: credential.role,
        ...(credential.classId && { classId: credential.classId })
      };

      setUser(authUser);
      localStorage.setItem('authUser', JSON.stringify(authUser));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message);
      setUser(null);
      localStorage.removeItem('authUser');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setError(null);
    localStorage.removeItem('authUser');
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    error,
    login,
    logout,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
