/**
 * Controlador de administración: gestión de usuarios y bloqueo de cuentas.
 */

import prisma from '../config/database.js';

/**
 * Devuelve todos los usuarios con información mínima y métricas de uso.
 */
export const getAdminUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            tools: true,
            subscriptions: true,
          },
        },
      },
    });

    res.json(
      users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
        createdAt: user.createdAt,
        toolsCount: user._count.tools,
        subscriptionsCount: user._count.subscriptions,
      })),
    );
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
