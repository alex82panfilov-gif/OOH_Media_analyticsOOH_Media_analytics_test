import { create } from 'zustand';
import { UserRole } from '../types';

interface AuthState {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userRole: null,
  setUserRole: (userRole) => set({ userRole }),
  logout: () => set({ userRole: null }),
}));
