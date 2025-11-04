import { useState, useEffect, useCallback } from 'react';
import { User } from '../types.ts';
import { loginUser } from '../utils/auth.ts';
import { 
    apiGetCurrentUser, 
    apiSetCurrentUser, 
    apiClearCurrentUser,
    apiGetCurrentUserSession,
    apiSetCurrentUserSession,
    apiClearCurrentUserSession,
    apiTrackLogin
} from '../api/mockApi.ts';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
        try {
            // Check persistent storage first, then session storage
            const storedUser = await apiGetCurrentUser() || await apiGetCurrentUserSession();
            if (storedUser) {
                setCurrentUser(storedUser);
            }
        } catch (error) {
            console.error("Failed to load session:", error);
            // Clear both on error to be safe
            await apiClearCurrentUser();
            await apiClearCurrentUserSession();
        } finally {
            setIsLoading(false);
        }
    }
    checkSession();
  }, []);

  const login = useCallback(async (username: string, password: string, rememberMe: boolean): Promise<User> => {
    const user = await loginUser(username, password);
    if (rememberMe) {
        await apiSetCurrentUser(user);
    } else {
        await apiSetCurrentUserSession(user);
    }
    setCurrentUser(user);
    
    // Track login event for admin analytics
    const ip = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    await apiTrackLogin(user.username, ip, navigator.userAgent);

    return user;
  }, []);

  const logout = useCallback(async () => {
    await apiClearCurrentUser();
    await apiClearCurrentUserSession();
    setCurrentUser(null);
  }, []);

  return {
    currentUser,
    login,
    logout,
    isLoading,
    isAuthenticated: !!currentUser,
  };
};