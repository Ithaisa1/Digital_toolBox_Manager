/**
 * Controlador de administración: gestión de usuarios y bloqueo de cuentas.
 */

import prisma from '../config/database.js';
import { contains, findPage, parsePagination, parseSearch } from '../utils/pagination.js';

/**
 * Devuelve los usuarios con información mínima y métricas de uso.
 * Query opcional: q (busca en nombre y email), page, limit.
 */
export const getAdminUsers = async (req, res, next) => {
  try {
    const search = parseSearch(req.query);
    const where = search
      ? { OR: [{ name: contains(search) }, { email: contains(search) }] }
      : {};

    const result = await findPage(prisma.user, {
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            tools: true,
            subscriptions: true,
          },
        },
      },
    }, parsePagination(req.query), (user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isBlocked: user.isBlocked,
      createdAt: user.createdAt,
      toolsCount: user._count.tools,
      subscriptionsCount: user._count.subscriptions,
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Alterna el estado bloqueado de un usuario.
 */
export const toggleUserBlock = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.userId === id) {
      return res.status(400).json({ error: 'You cannot block yourself' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isBlocked: !user.isBlocked },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBlocked: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
};
