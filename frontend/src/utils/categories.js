/**
 * Nombres de categoría traducidos.
 * En la base de datos se guardan en inglés ("Project Management"); aquí se muestran
 * en el idioma del usuario. Las categorías nuevas sin traducción se muestran tal cual.
 */

/** Nombre visible de una categoría (o "Sin categoría" si no hay). */
export const categoryLabel = (t, name) =>
  name ? t(`categoryNames.${name}`, { defaultValue: name }) : t('categoryNames.Uncategorized');

/** Categorías ordenadas alfabéticamente por su nombre traducido. */
export const sortCategories = (categories, t, language) =>
  [...categories].sort((a, b) =>
    categoryLabel(t, a.name).localeCompare(categoryLabel(t, b.name), language, { sensitivity: 'base' }),
  );

/**
 * Color de otoño de cada categoría, elegido por lo que representa.
 * Se usa en las barras del Dashboard, en las etiquetas y en las tarjetas de herramientas.
 */
const CATEGORY_COLORS = {
  Design: '#c8643b', // terracota: barro que se moldea
  'Video & Audio': '#a3404f', // granate de cine: el telón
  Development: '#6f8a3a', // musgo: código que crece poco a poco
  'Hosting & Cloud': '#6f8794', // niebla de otoño: la nube
  'Project Management': '#8b5a2b', // castaño: la estructura del árbol
  'Time Tracking': '#d4972f', // ámbar: la arena del reloj
  Communication: '#e07b39', // calabaza: cálido y cercano
  Productivity: '#9a9a3a', // oliva: trabajo que da fruto
  'Office & Documents': '#c9a86a', // trigo: papel y pergamino
  'Cloud Storage': '#5f7f86', // pizarra mojada: lo que se guarda
  'AI & Machine Learning': '#8a5578', // ciruela: lo nuevo y misterioso
  'Marketing & Social Media': '#c4452f', // arce rojo: lo que llama la atención
  'Sales & CRM': '#b8682f', // cobre: las ventas
  'Finance & Accounting': '#b8912f', // oro viejo: el dinero
  'Security & Privacy': '#3f6b4f', // pino: lo que resiste todo el año
  'Education & Learning': '#7a4e2d', // nogal: madera de pupitre
  'Entertainment & Streaming': '#9c3558', // arándano: el capricho
  Other: '#8a7a6a', // corteza: neutro
};

const FALLBACK_COLORS = ['#b8682f', '#6f8a3a', '#a3404f', '#d4972f', '#8a5578', '#5f7f86', '#c8643b'];

/** Color de una categoría (las creadas por el usuario reciben uno fijo según su nombre). */
export const categoryColor = (name) => {
  if (!name) return CATEGORY_COLORS.Other;
  if (CATEGORY_COLORS[name]) return CATEGORY_COLORS[name];
  const hash = [...name].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
};
