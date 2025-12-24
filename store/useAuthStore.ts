import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  company?: string;
  role: 'admin' | 'viewer';
}

interface RegisteredUser {
  name: string;
  company: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  // Simple map to simulate a database of registered users
  registeredUsers: Record<string, RegisteredUser>; 
  
  login: (email: string) => boolean;
  register: (email: string, name: string, company: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      registeredUsers: {},
      
      register: (email: string, name: string, company: string) => {
        set((state) => ({
            registeredUsers: {
                ...state.registeredUsers,
                [email.toLowerCase()]: { name, company }
            }
        }));
      },

      login: (email: string) => {
        const lowerEmail = email.toLowerCase();
        const registered = get().registeredUsers[lowerEmail];
        
        // If user registered, use their data, otherwise use default Admin
        const userData = registered ? {
            name: registered.name,
            company: registered.company,
            email: email,
            role: 'admin' as const
        } : {
            name: 'Admin Commander',
            company: 'Neon HQ',
            email: email,
            role: 'admin' as const
        };

        set({ 
          isAuthenticated: true, 
          user: { 
            id: '1', 
            ...userData
          } 
        });
        
        return true;
      },

      logout: () => {
        set({ isAuthenticated: false, user: null });
        // Optional: clear other stores if needed
        localStorage.removeItem('neondash-snapshots'); 
      }
    }),
    {
      name: 'neondash-auth', // localStorage key
    }
  )
);