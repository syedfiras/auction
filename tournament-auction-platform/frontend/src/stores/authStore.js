import { create } from 'zustand';
import { api } from '../services/api';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const useAuthStore = create((set) => ({
  session: null,
  isLoading: true,
  
  signIn: async (email, password) => {
    const data = await api.login(email, password);
    // data format: { token, user: { id, email, role, full_name, ... } }
    localStorage.setItem('token', data.token);
    set({ 
      session: { 
        user: data.user, 
        access_token: data.token 
      } 
    });
    return data;
  },
  
  signUp: async (email, password, metadata) => {
    const data = await api.register(
      email, 
      password, 
      metadata.full_name, 
      metadata.phone
    );
    localStorage.setItem('token', data.token);
    set({ 
      session: { 
        user: data.user, 
        access_token: data.token 
      } 
    });
    return data;
  },
  
  signOut: async () => {
    localStorage.removeItem('token');
    set({ session: null });
  },
  
  setSession: (session) => set({ session, isLoading: false }),
  
  loadToken: async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        set({
          session: {
            user: {
              id: payload.id,
              email: payload.email,
              role: payload.role,
              full_name: payload.full_name
            },
            access_token: token
          },
          isLoading: true
        });
        const response = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Session expired');
        const data = await response.json();
        set({
          session: { user: data.user, access_token: token },
          isLoading: false,
        });
      } catch (e) {
        console.error('Invalid token', e);
        localStorage.removeItem('token');
        set({ isLoading: false, session: null });
      }
    } else {
      set({ isLoading: false });
    }
  }
}));

// Auto-load token on app start
useAuthStore.getState().loadToken();
