/**
 * Contexto de autenticación: usuario, token, login, registro y sesión persistente.
 * Corregido: mejor manejo de promesas y evita memory leaks con listeners.
 */
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Restaura la sesión al montar si hay token guardado
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await api.get('/auth/profile');
          if (isMounted) {
            setUser(response.data);
            setToken(storedToken);
            console.info('Authenticated user loaded from token');
          }
        } catch (error) {
          console.warn('Failed to refresh authenticated user', {
            status: error.response?.status,
            data: error.response?.data,
          });
          if (isMounted) {
            localStorage.removeItem('token');
            localStorage.removeItem('language');
            setToken(null);
            setUser(null);
          }
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    };

    checkAuth();

    // Cleanup: evita actualizar estado si el componente se desmonta
    return () => {
      isMounted = false;
    };
  }, []);

  /** Inicia sesión y persiste token y usuario en estado local. */
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: userData, token: newToken } = response.data;
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('language', userData.language || 'es');
      setUser(userData);
      setToken(newToken);
      
      console.info('Login successful for email:', email);
      return { success: true };
    } catch (error) {
      
      // Solo desloguea si es 401 (token inválido/expirado)
      if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('language');
      setToken(null);
      setUser(null);
    }
      const apiData = error.response?.data;
      const details = apiData?.details
        ? apiData.details.map((detail) => `${detail.campo}: ${detail.mensaje}`).join(', ')
        : null;
      const detailMessage = apiData?.detail ? apiData.detail : details;
      const message = apiData?.error || apiData?.message || 'Login failed';
      const fullError = detailMessage ? `${message} (${detailMessage})` : message;
      
      console.error('Login failed', { 
        email, 
        status: error.response?.status, 
        message: fullError 
      });
      
      return {
        success: false,
        error: fullError,
      };
    }
  };

  /** Registra un usuario nuevo y deja la sesión iniciada. */
  const register = async (email, password, name) => {
    try {
      const response = await api.post('/auth/register', { email, password, name });
      const { user: userData, token: newToken } = response.data;
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('language', userData.language || 'es');
      setUser(userData);
      setToken(newToken);
      
      console.info('Registration successful for email:', email);
      return { success: true };
    } catch (error) {
      const apiData = error.response?.data;
      const details = apiData?.details
        ? apiData.details.map((detail) => `${detail.campo}: ${detail.mensaje}`).join(', ')
        : null;
      const detailMessage = apiData?.detail ? apiData.detail : details;
      const message = apiData?.error || apiData?.message || 'Registration failed';
      const fullError = detailMessage ? `${message} (${detailMessage})` : message;
      
      console.error('Registration failed', { 
        email, 
        status: error.response?.status, 
        message: fullError 
      });
      
      return {
        success: false,
        error: fullError,
      };
    }
  };

  /** Cierra sesión y limpia almacenamiento local. */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('language');
    setUser(null);
    setToken(null);
  };

  /** Vuelve a cargar el perfil desde el backend (p. ej. tras editar perfil). */
  const refreshUser = async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) return null;

    try {
      const response = await api.get('/auth/profile');
      localStorage.setItem('language', response.data.language || 'es');
      setUser(response.data);
      setToken(storedToken);
      console.info('User refreshed from backend');
      return response.data;
    } catch (error) {
      console.warn('Failed to refresh user', {
        status: error.response?.status,
        data: error.response?.data,
      });
      localStorage.removeItem('token');
      localStorage.removeItem('language');
      setToken(null);
      setUser(null);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, token, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

/** Hook para consumir el contexto de autenticación. */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};