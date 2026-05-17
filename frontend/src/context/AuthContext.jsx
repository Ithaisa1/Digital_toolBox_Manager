/**
 * Contexto de autenticación: usuario, token, login, registro y sesión persistente.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('language');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) return null;

    try {
      const response = await api.get('/auth/profile');
      const userData = response.data;
      if (userData.language) {
        localStorage.setItem('language', userData.language);
      }
      setUser(userData);
      return userData;
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('language');
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await api.get('/auth/profile');
          if (isMounted) {
            setUser(response.data);
          }
        } catch {
          if (isMounted) {
            localStorage.removeItem('token');
            localStorage.removeItem('language');
            setUser(null);
          }
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: userData, token: newToken } = response.data;

      localStorage.setItem('token', newToken);
      localStorage.setItem('language', userData.language || 'es');
      setUser(userData);

      return { success: true };
    } catch (error) {
      const apiData = error.response?.data;
      const details = apiData?.details
        ? apiData.details.map((d) => `${d.campo}: ${d.mensaje}`).join(', ')
        : null;
      const detailMessage = apiData?.detail || details;
      const message = apiData?.error || apiData?.message || 'Login failed';
      const fullError = detailMessage ? `${message} (${detailMessage})` : message;

      return { success: false, error: fullError };
    }
  };

  const register = async (email, password, name) => {
    try {
      const response = await api.post('/auth/register', { email, password, name });
      const { user: userData, token: newToken } = response.data;

      localStorage.setItem('token', newToken);
      localStorage.setItem('language', userData.language || 'es');
      setUser(userData);

      return { success: true };
    } catch (error) {
      const apiData = error.response?.data;
      const details = apiData?.details
        ? apiData.details.map((d) => `${d.campo}: ${d.mensaje}`).join(', ')
        : null;
      const detailMessage = apiData?.detail || details;
      const message = apiData?.error || apiData?.message || 'Registration failed';
      const fullError = detailMessage ? `${message} (${detailMessage})` : message;

      return { success: false, error: fullError };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
