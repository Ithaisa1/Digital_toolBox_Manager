/**
 * Utilidades del panel de administración: carga de datos y mensajes de error.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../services/api';

/**
 * Carga `path` con `params` y la recarga cuando cambian.
 * Ignora respuestas antiguas si el usuario cambia los filtros rápido.
 */
export const useAdminData = (path, params = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestId = useRef(0);
  const key = JSON.stringify(params);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(path, { params: JSON.parse(key) });
      if (id === requestId.current) setData(response.data);
    } catch (err) {
      if (id === requestId.current) setError(err);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [path, key]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load, setData };
};

/** Texto traducido para un error de la API del panel. */
export const adminErrorMessage = (t, err) => {
  const code = err?.response?.data?.code;
  if (code && ['self', 'demoProtected', 'lastAdmin'].includes(code)) return t(`adminPanel.errors.${code}`);
  if (err?.response?.status === 409) return t('adminPanel.errors.duplicate');
  return t('adminPanel.errors.generic');
};

/** Fecha corta en el idioma actual. */
export const formatDate = (value, locale, withTime = false) =>
  new Intl.DateTimeFormat(locale || 'es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(value));
