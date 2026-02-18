// hooks/useAuth.ts
import { useState } from 'react';
import { useStore } from '../store/useStore';
import { TabView } from '../types';

export const useAuth = () => {
  const setUserRole = useStore((state) => state.setUserRole);
  const setActiveTab = useStore((state) => state.setActiveTab);
  
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
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
    } catch (err) {
      setLoginError(true);
    } finally {
      setIsAuthLoading(false);
    }
  };

  return { password, setPassword, handleLogin, loginError, isAuthLoading };
};
