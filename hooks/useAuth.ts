import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { loginUser, registerUser } from '../utils/auth';

const CURRENT_USER_KEY = 'pathology_module_currentUser';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(CURRENT_USER_KEY);
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse stored user:", error);
      localStorage.removeItem(CURRENT_USER_KEY);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((username: string, password: string): User => {
    const user = loginUser(username, password);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    setCurrentUser(user);
    return user;
  }, []);

  const signup = useCallback((username: string, password: string, email: string): User => {
    const user = registerUser(username, password, email);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    setCurrentUser(user);
    return user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(CURRENT_USER_KEY);
    setCurrentUser(null);
  }, []);

  return {
    currentUser,
    login,
    signup,
    logout,
    isLoading,
    isAuthenticated: !!currentUser,
  };
};