/**
 * Descripción de un movimiento en el idioma del usuario.
 * El servidor guarda frases en inglés ("Tool "Figma" was created"); aquí se traducen
 * las conocidas y el resto se muestra tal cual.
 */
const PATTERNS = [
  [/^Tool "(.+)" was imported from CSV$/, 'imported'],
  [/^Tool "(.+)" was created$/, 'created'],
  [/^Tool "(.+)" was updated$/, 'updated'],
  [/^Tool "(.+)" was deleted$/, 'deleted'],
  [/^Price of "(.+)" changed from (.+) to (.+)$/, 'priceChange'],
];

export const describeMovement = (t, description) => {
  for (const [regex, key] of PATTERNS) {
    const match = regex.exec(description || '');
    if (match) {
      return t(`movementText.${key}`, { tool: match[1], from: match[2], to: match[3] });
    }
  }
  return description;
};
