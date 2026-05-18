import prisma from '../config/database.js';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';

const STATUS_LABELS = {
  ACTIVE: 'Activa',
  INACTIVE: 'Inactiva',
  ARCHIVED: 'Archivada',
};

const MOVEMENT_LABELS = {
  CREATED: 'Creada',
  UPDATED: 'Actualizada',
  DELETED: 'Eliminada',
  STATUS_CHANGE: 'Cambio de estado',
  PRICE_CHANGE: 'Cambio de precio',
};

const BILLING_LABELS = {
  monthly: 'Mensual',
  yearly: 'Anual',
};

export const exportUserData = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { format = 'csv', include = 'all' } = req.query;

    const [tools, subscriptions, movements, user] = await Promise.all([
      prisma.tool.findMany({
        where: { userId },
        include: {
          subscriptions: true,
          category: true,
          movements: { orderBy: { createdAt: 'desc' }, take: 10 },
        },
      }),
      prisma.subscription.findMany({
        where: { userId },
        include: { tool: { include: { category: true } } },
      }),
      prisma.movement.findMany({
        where: { userId },
        include: { tool: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
    ]);

    const toolsRows = tools.map((t) => ({
      'Herramienta': t.name,
      'Tipo': t.type,
      'URL': t.url || '—',
      'Precio': t.price ? `€${t.price.toFixed(2)}` : 'Gratis',
      'Estado': STATUS_LABELS[t.status] || t.status,
      'Categoría': t.category?.name || 'Sin categoría',
      'Creada': t.createdAt.toLocaleDateString('es-ES'),
    }));

    const subsRows = subscriptions.map((s) => ({
      'Herramienta': s.tool.name,
      'Precio': `€${s.price.toFixed(2)}`,
      'Ciclo': BILLING_LABELS[s.billingCycle] || s.billingCycle,
      'Plan': s.plan || '—',
      'Estado': STATUS_LABELS[s.status] || s.status,
      'Renovación': s.renewalDate.toLocaleDateString('es-ES'),
    }));

    const movRows = movements.map((m) => ({
      'Tipo': MOVEMENT_LABELS[m.type] || m.type,
      'Herramienta': m.tool?.name || 'Eliminada',
      'Descripción': m.description,
      'Fecha': m.createdAt.toLocaleDateString('es-ES'),
    }));

    if (format === 'pdf') {
      return generatePDF(res, user, toolsRows, subsRows, movRows, include);
    }

    let exportData = [];
    switch (include) {
      case 'tools':
        exportData = toolsRows;
        break;
      case 'subscriptions':
        exportData = subsRows;
        break;
      case 'movements':
        exportData = movRows;
        break;
      default:
        exportData = [
          ...toolsRows.map((r) => ({ Sección: 'Herramienta', ...r })),
          ...subsRows.map((r) => ({ Sección: 'Suscripción', ...r })),
          ...movRows.map((r) => ({ Sección: 'Movimiento', ...r })),
        ];
    }

    if (format === 'csv') {
      if (exportData.length === 0) {
        const csvParser = new Parser();
        const csv = csvParser.parse([{ Info: 'No hay datos para exportar' }]);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="toolbox-${sanitizeDate()}.csv"`);
        return res.send('\uFEFF' + csv);
      }
      const csvParser = new Parser();
      const csv = csvParser.parse(exportData);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="toolbox-${sanitizeDate()}.csv"`);
      return res.send('\uFEFF' + csv);
    }

    res.json({ success: true, data: exportData, count: exportData.length, exportDate: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
};

function generatePDF(res, user, toolsRows, subsRows, movRows, include) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const filename = `toolbox-${sanitizeDate()}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  doc.pipe(res);

  const primaryColor = '#3B82F6';
  const darkColor = '#1E293B';
  const lightGray = '#F1F5F9';
  const borderColor = '#E2E8F0';
  const textColor = '#334155';
  const mutedColor = '#94A3B8';

  // Header
  doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);
  doc.fillColor('#FFFFFF').fontSize(24).font('Helvetica-Bold').text('Digital Toolbox Manager', 40, 30);
  doc.fontSize(12).font('Helvetica').text(`Informe de ${user.name}`, 40, 62);
  doc.fontSize(10).fillColor('#CBD5E1').text(`Generado: ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`, 40, 82);

  let y = 130;

  // Summary box
  const totalCost = subsRows.reduce((sum, s) => sum + parseFloat(s.Precio.replace('€', '')) || 0, 0);
  doc.roundedRect(40, y, doc.page.width - 80, 60, 8).fill(lightGray).stroke(borderColor);
  doc.fillColor(darkColor).fontSize(10).font('Helvetica-Bold').text('RESUMEN', 55, y + 12);
  doc.fontSize(11).font('Helvetica').fillColor(textColor)
    .text(`Herramientas: ${toolsRows.length}`, 55, y + 30)
    .text(`Suscripciones: ${subsRows.length}`, 200, y + 30)
    .text(`Movimientos: ${movRows.length}`, 350, y + 30);
  doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryColor).text(`Coste mensual: €${totalCost.toFixed(2)}`, 55, y + 48);

  y += 80;

  const addSection = (title, rows, emoji) => {
    if (rows.length === 0) return;

    if (y > doc.page.height - 120) {
      doc.addPage();
      y = 40;
    }

    doc.fillColor(darkColor).fontSize(14).font('Helvetica-Bold').text(`${emoji} ${title}`, 40, y);
    y += 20;

    const keys = Object.keys(rows[0]);
    const widths = keys.map((key, i) => {
      if (i === 0) return 130;
      if (key === 'Descripción') return 180;
      return 90;
    });

    // Header row
    let x = 40;
    doc.roundedRect(40, y, doc.page.width - 80, 22, 4).fill(primaryColor);
    doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
    keys.forEach((key, i) => {
      doc.text(key, x + 4, y + 6, { width: widths[i] - 8, ellipsis: true });
      x += widths[i];
    });
    y += 22;

    // Data rows
    rows.forEach((row, rowIdx) => {
      if (y > doc.page.height - 40) {
        doc.addPage();
        y = 40;
        // Reprint header on new page
        x = 40;
        doc.roundedRect(40, y, doc.page.width - 80, 22, 4).fill(primaryColor);
        doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
        keys.forEach((key, i) => {
          doc.text(key, x + 4, y + 6, { width: widths[i] - 8, ellipsis: true });
          x += widths[i];
        });
        y += 22;
      }

      if (rowIdx % 2 === 0) {
        doc.roundedRect(40, y, doc.page.width - 80, 20, 2).fill(lightGray);
      }

      doc.fillColor(textColor).fontSize(8).font('Helvetica');
      x = 40;
      keys.forEach((key, i) => {
        doc.text(String(row[key] || '—'), x + 4, y + 4, { width: widths[i] - 8, ellipsis: true });
        x += widths[i];
      });
      y += 20;
    });

    y += 15;
  };

  if (include === 'all' || include === 'tools') addSection('Herramientas', toolsRows, '🛠️');
  if (include === 'all' || include === 'subscriptions') addSection('Suscripciones', subsRows, '💳');
  if (include === 'all' || include === 'movements') addSection('Historial de cambios', movRows, '');

  // Footer
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).fillColor(mutedColor).text(
      `Digital Toolbox Manager — Página ${i + 1} de ${pageCount}`,
      40,
      doc.page.height - 30,
      { align: 'center' },
    );
  }

  doc.end();
}

function sanitizeDate() {
  return new Date().toISOString().split('T')[0];
}

export const generateAnalyticsReport = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { period = 'monthly' } = req.query;

    const now = new Date();
    let startDate;
    switch (period) {
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const [tools, subscriptions, movements] = await Promise.all([
      prisma.tool.findMany({ where: { userId, createdAt: { gte: startDate } } }),
      prisma.subscription.findMany({ where: { userId, createdAt: { gte: startDate } } }),
      prisma.movement.findMany({ where: { userId, createdAt: { gte: startDate } } }),
    ]);

    const analytics = {
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      summary: {
        totalTools: tools.length,
        totalSubscriptions: subscriptions.length,
        totalMovements: movements.length,
        totalCost: subscriptions.reduce((sum, s) => sum + (s.price || 0), 0),
      },
      toolsByType: tools.reduce((acc, t) => { acc[t.type] = (acc[t.type] || 0) + 1; return acc; }, {}),
      subscriptionsByStatus: subscriptions.reduce((acc, s) => { acc[s.status] = (acc[s.status] || 0) + 1; return acc; }, {}),
      movementsByType: movements.reduce((acc, m) => { acc[m.type] = (acc[m.type] || 0) + 1; return acc; }, {}),
    };

    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};
