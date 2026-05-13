import prisma from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { attachToolLogo, attachSubscriptionLogo } from '../utils/productLogo.js';

export const getAllTools = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { status, category } = req.query;

    const where = { userId };
    if (status) where.status = status;
    if (category) where.categoryId = category;

    const tools = await prisma.tool.findMany({
      where,
      include: {
        category: true,
        subscriptions: {
          include: {
            tool: {
              include: {
                category: true,
              },
            },
          },
        },
        _count: {
          select: { movements: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(tools.map((tool) => ({
      ...attachToolLogo(tool),
      subscriptions: (tool.subscriptions || []).map(attachSubscriptionLogo),
    })));
  } catch (error) {
    next(error);
  }
};

export const getToolById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const tool = await prisma.tool.findFirst({
      where: { id, userId },
      include: {
        category: true,
        subscriptions: {
          include: {
            tool: {
              include: {
                category: true,
              },
            },
          },
        },
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    res.json({
      ...attachToolLogo(tool),
      subscriptions: (tool.subscriptions || []).map(attachSubscriptionLogo),
    });
  } catch (error) {
    next(error);
  }
};

export const createTool = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { name, type, url, price, status, categoryId } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    const tool = await prisma.tool.create({
      data: {
        name,
        type,
        url,
        price: price ? parseFloat(price) : null,
        status: status || 'ACTIVE',
        categoryId,
        userId,
      },
      include: {
        category: true,
      },
    });

    // Create movement record
    await prisma.movement.create({
      data: {
        toolId: tool.id,
        userId,
        type: 'CREATED',
        description: `Tool "${name}" was created`,
        newData: JSON.stringify(tool),
      },
    });

    res.status(201).json(attachToolLogo(tool));
  } catch (error) {
    next(error);
  }
};

export const updateTool = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { name, type, url, price, status, categoryId } = req.body;

    const existingTool = await prisma.tool.findFirst({
      where: { id, userId },
    });

    if (!existingTool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    const tool = await prisma.tool.update({
      where: { id },
      data: {
        name: name || existingTool.name,
        type: type || existingTool.type,
        url: url !== undefined ? url : existingTool.url,
        price: price !== undefined ? parseFloat(price) : existingTool.price,
        status: status || existingTool.status,
        categoryId: categoryId !== undefined ? categoryId : existingTool.categoryId,
      },
      include: {
        category: true,
      },
    });

    // Create movement record
    await prisma.movement.create({
      data: {
        toolId: tool.id,
        userId,
        type: 'UPDATED',
        description: `Tool "${name}" was updated`,
        previousData: JSON.stringify(existingTool),
        newData: JSON.stringify(tool),
      },
    });

    res.json(attachToolLogo(tool));
  } catch (error) {
    next(error);
  }
};

export const deleteTool = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const tool = await prisma.tool.findFirst({
      where: { id, userId },
    });

    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    await prisma.tool.delete({
      where: { id },
    });

    // Create movement record
    await prisma.movement.create({
      data: {
        userId,
        type: 'DELETED',
        description: `Tool "${tool.name}" was deleted`,
        previousData: JSON.stringify(tool),
      },
    });

    res.json({ message: 'Tool deleted successfully' });
  } catch (error) {
    next(error);
  }
};
