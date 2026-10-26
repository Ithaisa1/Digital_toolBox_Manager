import { useEffect, useMemo, useState } from 'react';

/**
 * Pagina una lista en el navegador.
 * Vuelve a la página 1 cuando cambia `resetKey` (p. ej. la búsqueda o un filtro).
 */
export const usePagination = (items, pageSize, resetKey) => {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  // Si la lista se acorta (p. ej. al borrar), no quedarse en una página vacía
  const currentPage = Math.min(page, totalPages);

  const pageItems = useMemo(
    () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [items, currentPage, pageSize],
  );

  return { page: currentPage, setPage, totalPages, pageItems, total: items.length };
};
