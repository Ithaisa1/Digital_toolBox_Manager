/**
 * Controlador CRUD de herramientas digitales del usuario.
 * Gestiona listado, detalle, creación, actualización y eliminación con registro de movimientos y logos.
 */

import prisma from "../config/database.js";
import {
  attachToolLogo,
  attachSubscriptionLogo,
} from "../utils/productLogo.js";
import { contains, findPage, parsePagination, parseSearch } from "../utils/pagination.js";
import { buildImportPlan, MAX_IMPORT_ROWS } from "../utils/toolImport.js";

/** "" o espacios → null (los formularios envían campos vacíos como ""). */
const emptyToNull = (value) =>
  typeof value === "string" && value.trim() === "" ? null : value;

/**
 * Lista todas las herramientas del usuario autenticado con filtros opcionales.
 * @param {import('express').Request} req - query: { status?, category?, q?, page?, limit? }.
 * @param {import('express').Response} res - 200 con array de herramientas (logos adjuntos), o página si se envía page/limit.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const getAllTools = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { status, category } = req.query;
    const search = parseSearch(req.query);

    const where = { userId };
    if (status) where.status = status;
    if (category) where.categoryId = category;
    if (search) {
      where.OR = [
        { name: contains(search) },
        { type: contains(search) },
        { description: contains(search) },
        { category: { name: contains(search) } },
      ];
    }

    const result = await findPage(prisma.tool, {
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
      orderBy: { createdAt: "desc" },
    }, parsePagination(req.query), (tool) => ({
      ...attachToolLogo(tool),
      subscriptions: (tool.subscriptions || []).map(attachSubscriptionLogo),
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene una herramienta por ID si pertenece al usuario autenticado.
 * @param {import('express').Request} req - params: { id }.
 * @param {import('express').Response} res - 200 con herramienta y últimos movimientos, o 404.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
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
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!tool) {
      return res.status(404).json({ error: "Tool not found" });
    }

    res.json({
      ...attachToolLogo(tool),
      subscriptions: (tool.subscriptions || []).map(attachSubscriptionLogo),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crea una nueva herramienta para el usuario y registra un movimiento de tipo CREATED.
 * @param {import('express').Request} req - body: { name, type, url?, price?, status?, categoryId? }.
 * @param {import('express').Response} res - 201 con la herramienta creada, o 400 si faltan campos.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const createTool = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { name, type, url, price, status, categoryId, description } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: "Name and type are required" });
    }

    const tool = await prisma.tool.create({
      data: {
        name,
        type,
        url: emptyToNull(url) ?? null,
        description: emptyToNull(description) ?? null,
        price: price !== undefined && price !== null && price !== "" ? parseFloat(price) : null,
        status: status || "ACTIVE",
        categoryId: emptyToNull(categoryId) ?? null,
        userId,
      },
      include: {
        category: true,
      },
    });

    // Registrar movimiento de auditoría
    await prisma.movement.create({
      data: {
        toolId: tool.id,
        userId,
        type: "CREATED",
        description: `Tool "${name}" was created`,
        newData: JSON.stringify(tool),
      },
    });

    res.status(201).json(attachToolLogo(tool));
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza una herramienta existente y registra un movimiento de tipo UPDATED.
 * @param {import('express').Request} req - params: { id }; body con campos a actualizar.
 * @param {import('express').Response} res - 200 con herramienta actualizada, o 404 si no existe.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const updateTool = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { name, type, url, price, status, categoryId, description } = req.body;

    const existingTool = await prisma.tool.findFirst({
      where: { id, userId },
    });

    if (!existingTool) {
      return res.status(404).json({ error: "Tool not found" });
    }

    const resolvedName = name || existingTool.name;
    const resolvedType = type || existingTool.type;

    const tool = await prisma.tool.update({
      where: { id },
      data: {
        name: resolvedName,
        type: resolvedType,
        url: url !== undefined ? emptyToNull(url) : existingTool.url,
        description:
          description !== undefined ? emptyToNull(description) : existingTool.description,
        price:
          price !== undefined && price !== null
            ? parseFloat(price)
            : existingTool.price,
        status: status || existingTool.status,
        categoryId:
          categoryId !== undefined ? emptyToNull(categoryId) : existingTool.categoryId,
      },
      include: {
        category: true,
      },
    });

    // Registrar movimiento con datos anterior y nuevo
    await prisma.movement.create({
      data: {
        toolId: tool.id,
        userId,
        type: "UPDATED",
        description: `Tool "${resolvedName}" was updated`,
        previousData: JSON.stringify(existingTool),
        newData: JSON.stringify(tool),
      },
    });

    res.json(attachToolLogo(tool));
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina una herramienta del usuario y registra un movimiento de tipo DELETED.
 * @param {import('express').Request} req - params: { id }.
 * @param {import('express').Response} res - 200 con mensaje de éxito, o 404 si no existe.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const deleteTool = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const tool = await prisma.tool.findFirst({
      where: { id, userId },
    });

    if (!tool) {
      return res.status(404).json({ error: "Tool not found" });
    }

    await prisma.tool.delete({
      where: { id },
    });

    // Registrar movimiento de eliminación (sin toolId asociado)
    await prisma.movement.create({
      data: {
        userId,
        type: "DELETED",
        description: `Tool "${tool.name}" was deleted`,
        previousData: JSON.stringify(tool),
      },
    });

    res.json({ message: "Tool deleted successfully" });
  } catch (error) {
    next(error);
  }
};

/** Tamaño máximo del texto CSV aceptado (1 MB). */
const MAX_IMPORT_CHARS = 1024 * 1024;

/**
 * Importa herramientas desde un CSV.
 * Con dryRun=true solo devuelve la vista previa; si no, crea las filas válidas
 * (todas o ninguna) y registra un movimiento CREATED por cada una.
 * @param {import('express').Request} req - body: { csv: string, dryRun?: boolean }.
 * @param {import('express').Response} res - 200 con { summary, rows, created? } o 400 si el archivo no sirve.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const importTools = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { csv, dryRun = false } = req.body || {};

    if (typeof csv !== "string" || !csv.trim()) {
      return res.status(400).json({ error: "CSV content is required", code: "emptyFile" });
    }
    if (csv.length > MAX_IMPORT_CHARS) {
      return res.status(400).json({ error: "CSV file is too large (max 1 MB)", code: "fileTooLarge" });
    }

    const [categories, existing] = await Promise.all([
      prisma.category.findMany({ select: { id: true, name: true } }),
      prisma.tool.findMany({ where: { userId }, select: { name: true } }),
    ]);

    const plan = buildImportPlan(csv, {
      categories,
      existingNames: existing.map((tool) => tool.name),
    });

    if (plan.error) {
      return res.status(400).json({ error: "Invalid CSV file", code: plan.error, maxRows: MAX_IMPORT_ROWS });
    }

    if (dryRun) {
      return res.json(plan);
    }

    const toCreate = plan.rows.filter((row) => row.result === "new");

    const created = await prisma.$transaction(async (tx) => {
      const tools = [];
      for (const { data } of toCreate) {
        const tool = await tx.tool.create({
          data: {
            name: data.name,
            type: data.type,
            url: data.url,
            price: data.price,
            description: data.description,
            status: data.status,
            categoryId: data.categoryId,
            userId,
          },
        });
        await tx.movement.create({
          data: {
            toolId: tool.id,
            userId,
            type: "CREATED",
            description: `Tool "${tool.name}" was imported from CSV`,
            newData: JSON.stringify(tool),
          },
        });
        tools.push(tool);
      }
      return tools;
    }, { timeout: 30000 });

    res.json({ ...plan, created: created.length });
  } catch (error) {
    next(error);
  }
};
