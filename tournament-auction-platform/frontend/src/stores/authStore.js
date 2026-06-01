import { create } from 'zustand';
import { api } from '../services/api';

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
      metadata.role, 
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
  
  loadToken: () => {
    const token = localStorage.getItem('token');
    if (token) {
      // Decode JWT to get user info (optional, or you can fetch /me endpoint)
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
          isLoading: false 
        });
      } catch (e) {
        console.error('Invalid token', e);
        set({ isLoading: false, session: null });
      }
    } else {
      set({ isLoading: false });
    }
  }
}));

// Auto-load token on app start
useAuthStore.getState().loadToken();