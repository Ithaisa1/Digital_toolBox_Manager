/**
 * Paginación y búsqueda opcionales para los endpoints de listas.
 *
 * Si la petición NO trae `page` ni `limit`, el endpoint responde como siempre
 * (un array). Si los trae, responde con { items, total, page, limit, totalPages }.
 */
import prisma from '../config/database.js';

export const MAX_LIMIT = 100;

/**
 * Lee `page` y `limit` de la query.
 * @returns {{page: number, limit: number, skip: number} | null} null si no se pidió paginar.
 */
export const parsePagination = (query = {}, defaultLimit = 20) => {
  if (query.page === undefined && query.limit === undefined) return null;

  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
};

/** Texto de búsqueda limpio (`q`), o null si no hay. */
export const parseSearch = (query = {}) => {
  const q = query.q;
  if (typeof q !== 'string') return null;
  const trimmed = q.trim().slice(0, 100);
  return trimmed || null;
};

/** Filtro Prisma "contiene, sin distinguir mayúsculas". */
export const contains = (text) => ({ contains: text, mode: 'insensitive' });

/**
 * Ejecuta un findMany paginado (o completo si no hay paginación).
 * @param {object} delegate - Modelo Prisma, p. ej. prisma.tool
 * @param {object} args - Argumentos de findMany (where, include, orderBy...)
 * @param {{page, limit, skip} | null} pagination
 * @param {(item: any) => any} [map] - Transformación de cada elemento.
 * @returns {Promise<Array | {items, total, page, limit, totalPages}>}
 */
export const findPage = async (delegate, args, pagination, map = (item) => item) => {
  if (!pagination) {
    const items = await delegate.findMany(args);
    return items.map(map);
  }

  const { page, limit, skip } = pagination;
  const [items, total] = await prisma.$transaction([
    delegate.findMany({ ...args, skip, take: limit }),
    delegate.count({ where: args.where }),
  ]);

  return {
    items: items.map(map),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};
