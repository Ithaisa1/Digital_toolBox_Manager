/**
 * Controlador CRUD de categorías de herramientas.
 * Las categorías son compartidas globalmente y agrupan herramientas por tipo o ámbito.
 */

import prisma from '../config/database.js';

/**
 * Obtiene todas las categorías ordenadas por nombre con conteo de herramientas.
 * @param {import('express').Request} req - Sin parámetros específicos.
 * @param {import('express').Response} res - 200 con array de categorías.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const getAllCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { tools: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(categories);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene una categoría por ID incluyendo sus herramientas asociadas.
 * @param {import('express').Request} req - params: { id }.
 * @param {import('express').Response} res - 200 con la categoría, o 404 si no existe.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        tools: true,
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    next(error);
  }
};

/**
 * Crea una nueva categoría.
 * @param {import('express').Request} req - body: { name, description? }.
 * @param {import('express').Response} res - 201 con la categoría creada, o 400 si falta el nombre.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
      },
    });

    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza nombre y/o descripción de una categoría existente.
 * @param {import('express').Request} req - params: { id }; body: { name?, description? }.
 * @param {import('express').Response} res - 200 con la categoría actualizada.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
      },
    });

    res.json(category);
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina una categoría por ID.
 * @param {import('express').Request} req - params: { id }.
 * @param {import('express').Response} res - 200 con mensaje de éxito.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.category.delete({
      where: { id },
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};
