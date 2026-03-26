import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { api } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  tier: 'free' | 'premium' | 'pro';
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | null;
  subscriptionEnd?: string | null;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name?: string; email?: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('lbp_token');
    if (token) {
      api<User>('/auth/me')
        .then((data) => setUser(data))
        .catch(() => {
          localStorage.removeItem('lbp_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('lbp_token', data.token);
    setUser(data.user);

    // Notify extension via postMessage
    try {
      window.postMessage({ type: 'LBP_AUTH', token: data.token, user: data.user }, '*');
    } catch {
      // silently fail if postMessage is unavailable
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await api<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    localStorage.setItem('lbp_token', data.token);
    setUser(data.user);

    try {
      window.postMessage({ type: 'LBP_AUTH', token: data.token, user: data.user }, '*');
    } catch {
      // silently fail
    }
  };

  const logout = () => {
    localStorage.removeItem('lbp_token');
    setUser(null);
    try {
      window.postMessage({ type: 'LBP_LOGOUT' }, '*');
    } catch {
      // silently fail
    }
  };

  const updateProfile = async (data: { name?: string; email?: string }) => {
    const res = await api<User>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    setUser(res);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await api('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
