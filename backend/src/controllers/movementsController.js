import prisma from '../config/database.js';

export const getAllMovements = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { toolId } = req.query;

    const where = { userId };
    if (toolId) where.toolId = toolId;

    const movements = await prisma.movement.findMany({
      where,
      include: {
        tool: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json(movements);
  } catch (error) {
    next(error);
  }
};

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
