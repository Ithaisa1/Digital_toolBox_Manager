/**
 * Controlador de consulta del historial de movimientos (auditoría).
 * Los movimientos registran acciones sobre herramientas: creación, actualización y eliminación.
 */

import prisma from '../config/database.js';
import { contains, findPage, parsePagination, parseSearch } from '../utils/pagination.js';

/**
 * Lista los últimos movimientos del usuario, opcionalmente filtrados por herramienta.
 * @param {import('express').Request} req - query: { toolId?, q?, page?, limit? }.
 * @param {import('express').Response} res - 200 con hasta 50 movimientos (sin paginar) o una página, por fecha descendente.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const getAllMovements = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { toolId } = req.query;

    const where = { userId };
    if (toolId) where.toolId = toolId;

    const search = parseSearch(req.query);
    if (search) where.description = contains(search);

    const pagination = parsePagination(req.query);
    const result = await findPage(prisma.movement, {
      where,
      include: {
        tool: true,
      },
      orderBy: { createdAt: 'desc' },
      // Sin paginación se mantienen los 50 más recientes, como antes
      ...(pagination ? {} : { take: 50 }),
    }, pagination);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene un movimiento por ID si pertenece al usuario autenticado.
 * @param {import('express').Request} req - params: { id }.
 * @param {import('express').Response} res - 200 con el movimiento y su herramienta, o 404.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const getMovementById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const movement = await prisma.movement.findFirst({
      where: { id, userId },
      include: {
        tool: true,
      },
    });

    if (!movement) {
      return res.status(404).json({ error: 'Movement not found' });
    }

    res.json(movement);
  } catch (error) {
    next(error);
  }
};
