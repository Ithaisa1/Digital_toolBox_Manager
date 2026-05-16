/**
 * Descripciones por defecto de productos conocidos cuando la API no envía descripción.
 */
const PRODUCT_DESCRIPTION_MAP = [
  { match: ['adobe creative cloud', 'adobe'], description: 'Suite creativa para diseño, foto y video.' },
  { match: ['indesign'], description: 'Maquetacion profesional para publicaciones.' },
  { match: ['illustrator'], description: 'Ilustracion vectorial y branding.' },
  { match: ['photoshop'], description: 'Edicion y retoque de imagenes.' },
  { match: ['lightroom'], description: 'Organizacion y revelado fotografico.' },
  { match: ['after effects', 'aftereffects'], description: 'Animacion y motion graphics para video.' },
  { match: ['canva'], description: 'Diseno visual rapido para contenido y presentaciones.' },
  { match: ['figma'], description: 'Diseno y prototipado colaborativo de interfaces.' },
  { match: ['notion'], description: 'Espacio de trabajo para notas, tareas y documentacion.' },
  { match: ['slack'], description: 'Comunicacion en equipo con canales y automatizaciones.' },
  { match: ['trello'], description: 'Gestion visual de proyectos con tableros.' },
  { match: ['zoom'], description: 'Videollamadas y reuniones online.' },
  { match: ['microsoft teams', 'teams'], description: 'Colaboracion, chat y reuniones en un solo lugar.' },
  { match: ['github copilot', 'copilot'], description: 'Asistente de IA para escribir y revisar codigo.' },
  { match: ['claude'], description: 'IA conversacional para redactar, analizar y crear.' },
  { match: ['chatgpt'], description: 'IA para asistencia general, redaccion y productividad.' },
  { match: ['vscode', 'vs code'], description: 'Editor de codigo ligero y extensible.' },
  { match: ['jetbrains'], description: 'Suite de IDEs profesionales para desarrollo.' },
  { match: ['lm studio'], description: 'Ejecuta modelos de IA localmente en tu equipo.' },
  { match: ['hugging face'], description: 'Plataforma para modelos, datasets y herramientas de IA.' },
  { match: ['midjourney'], description: 'Generacion de imagenes con IA para creacion visual.' },
  { match: ['runway'], description: 'Edicion de video y contenido generativo con IA.' },
  { match: ['openai'], description: 'Herramientas de IA para productividad y automatizacion.' },
];

/** Busca la primera coincidencia por nombre o tipo de herramienta. */
export const getToolDescription = (tool) => {
  const normalizedName = String(tool?.name || tool?.type || '')
    .trim()
    .toLowerCase();

  const entry = PRODUCT_DESCRIPTION_MAP.find(({ match }) =>
    match.some((value) => normalizedName.includes(value))
  );

  return entry?.description || '';
};
