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
