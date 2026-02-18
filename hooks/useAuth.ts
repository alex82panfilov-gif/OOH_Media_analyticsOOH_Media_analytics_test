import { useState, type FormEvent } from 'react';
import { TabView } from '../types';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';

export const useAuth = () => {
  const setUserRole = useAuthStore((state) => state.setUserRole);
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setLoginError(false);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const result = await response.json();
        setUserRole(result.role);
        if (result.role === 'GUEST') setActiveTab(TabView.ANALYTICS);
      } else {
        setLoginError(true);
      }
    } catch {
      setLoginError(true);
    } finally {
      setIsAuthLoading(false);
    }
  };

  return { password, setPassword, handleLogin, loginError, isAuthLoading };
};
