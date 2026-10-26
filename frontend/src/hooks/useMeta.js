/**
 * Información pública de la instalación (GET /api/meta): p. ej. si es la web de demo.
 * Se pide una sola vez y se comparte entre componentes.
 */
import { useEffect, useState } from 'react';
import api from '../services/api';

let cache = null;
let pending = null;

const loadMeta = () => {
  if (!pending) {
    pending = api
      .get('/meta')
      .then((response) => {
        cache = response.data;
        return cache;
      })
      .catch(() => {
        cache = { demo: false, accounts: [] };
        return cache;
      });
  }
  return pending;
};

export const useMeta = () => {
  const [meta, setMeta] = useState(cache);

  useEffect(() => {
    if (!cache) loadMeta().then(setMeta);
  }, []);

  return meta || { demo: false, accounts: [] };
};
