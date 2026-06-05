import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  role: 'declarant' | 'inspector' | 'driver' | 'reviewer';
  name: string;
  phone?: string;
}

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));

export const roleNames: Record<string, string> = {
  declarant: '申报员',
  inspector: '检疫员',
  driver: '司机',
  reviewer: '复核员',
};
