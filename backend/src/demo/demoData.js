/**
 * Datos de la web de demo (portfolio).
 * Genera usuarios, herramientas, suscripciones y actividad realistas, siempre iguales
 * para la misma fecha (generador pseudoaleatorio con semilla), y los carga en la BD.
 */
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { DEFAULT_CATEGORIES } from '../data/defaultCategories.js';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../config/demo.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Generador pseudoaleatorio con semilla (mulberry32). */
const createRandom = (seed) => {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    pick: (list) => list[Math.floor(next() * list.length)],
    chance: (p) => next() < p,
    sample: (list, count) => {
      const copy = [...list];
      const out = [];
      while (copy.length && out.length < count) out.push(copy.splice(Math.floor(next() * copy.length), 1)[0]);
      return out;
    },
  };
};

/** Catálogo: [nombre, tipo, url, precio €/mes (0 = gratis), categoría, ciclo habitual] */
const CATALOG = [
  ['Figma', 'Design Tool', 'https://figma.com', 15, 'Design', 'monthly'],
  ['Adobe Photoshop', 'Photo Editing', 'https://adobe.com/products/photoshop', 24, 'Design', 'monthly'],
  ['Adobe Illustrator', 'Design Tool', 'https://adobe.com/products/illustrator', 24, 'Design', 'monthly'],
  ['Adobe InDesign', 'Design Tool', 'https://adobe.com/products/indesign', 24, 'Design', 'monthly'],
  ['Adobe Creative Cloud', 'Design Suite', 'https://adobe.com/creativecloud', 66, 'Design', 'monthly'],
  ['Canva', 'Design Tool', 'https://canva.com', 0, 'Design', 'monthly'],
  ['Adobe Premiere Pro', 'Video Editing', 'https://adobe.com/products/premiere', 24, 'Video & Audio', 'monthly'],
  ['DaVinci Resolve', 'Video Editing', 'https://blackmagicdesign.com/products/davinciresolve', 0, 'Video & Audio', 'yearly'],
  ['CapCut', 'Video Editing', 'https://capcut.com', 8, 'Video & Audio', 'monthly'],
  ['GitHub', 'Development', 'https://github.com', 4, 'Development', 'monthly'],
  ['VS Code', 'IDE', 'https://code.visualstudio.com', 0, 'Development', 'monthly'],
  ['Cursor', 'IDE', 'https://cursor.com', 20, 'Development', 'monthly'],
  ['JetBrains', 'IDE', 'https://jetbrains.com', 25, 'Development', 'yearly'],
  ['Postman', 'API Testing', 'https://postman.com', 0, 'Development', 'monthly'],
  ['Vercel', 'Hosting', 'https://vercel.com', 20, 'Hosting & Cloud', 'monthly'],
  ['Netlify', 'Hosting', 'https://netlify.com', 0, 'Hosting & Cloud', 'monthly'],
  ['Hostinger', 'Hosting', 'https://hostinger.com', 3, 'Hosting & Cloud', 'yearly'],
  ['Trello', 'Project Management', 'https://trello.com', 5, 'Project Management', 'monthly'],
  ['Asana', 'Project Management', 'https://asana.com', 11, 'Project Management', 'monthly'],
  ['Jira', 'Project Management', 'https://atlassian.com/software/jira', 8, 'Project Management', 'monthly'],
  ['ClickUp', 'Project Management', 'https://clickup.com', 7, 'Project Management', 'monthly'],
  ['Linear', 'Project Management', 'https://linear.app', 8, 'Project Management', 'monthly'],
  ['Toggl Track', 'Time Tracking', 'https://toggl.com/track', 9, 'Time Tracking', 'monthly'],
  ['Clockify', 'Time Tracking', 'https://clockify.me', 0, 'Time Tracking', 'monthly'],
  ['Harvest', 'Time Tracking', 'https://getharvest.com', 11, 'Time Tracking', 'monthly'],
  ['Slack', 'Communication', 'https://slack.com', 8, 'Communication', 'monthly'],
  ['Microsoft Teams', 'Communication', 'https://teams.microsoft.com', 4, 'Communication', 'monthly'],
  ['Zoom', 'Video Conferencing', 'https://zoom.us', 14, 'Communication', 'monthly'],
  ['Discord', 'Communication', 'https://discord.com', 0, 'Communication', 'monthly'],
  ['Notion', 'Productivity', 'https://notion.so', 10, 'Productivity', 'monthly'],
  ['Evernote', 'Notes', 'https://evernote.com', 11, 'Productivity', 'monthly'],
  ['Todoist', 'Tasks', 'https://todoist.com', 4, 'Productivity', 'yearly'],
  ['Miro', 'Whiteboard', 'https://miro.com', 8, 'Productivity', 'monthly'],
  ['Microsoft 365', 'Office Suite', 'https://microsoft.com/microsoft-365', 10, 'Office & Documents', 'yearly'],
  ['Google Workspace', 'Office Suite', 'https://workspace.google.com', 7, 'Office & Documents', 'monthly'],
  ['Adobe Acrobat', 'PDF', 'https://adobe.com/acrobat', 18, 'Office & Documents', 'monthly'],
  ['Dropbox', 'Cloud Storage', 'https://dropbox.com', 12, 'Cloud Storage', 'monthly'],
  ['Google Drive', 'Cloud Storage', 'https://drive.google.com', 2, 'Cloud Storage', 'monthly'],
  ['iCloud+', 'Cloud Storage', 'https://icloud.com', 3, 'Cloud Storage', 'monthly'],
  ['ChatGPT', 'AI Assistant', 'https://chat.openai.com', 23, 'AI & Machine Learning', 'monthly'],
  ['Claude', 'AI Assistant', 'https://claude.ai', 22, 'AI & Machine Learning', 'monthly'],
  ['Midjourney', 'AI Images', 'https://midjourney.com', 10, 'AI & Machine Learning', 'monthly'],
  ['Perplexity', 'AI Search', 'https://perplexity.ai', 20, 'AI & Machine Learning', 'monthly'],
  ['Mailchimp', 'Email Marketing', 'https://mailchimp.com', 13, 'Marketing & Social Media', 'monthly'],
  ['Buffer', 'Social Media', 'https://buffer.com', 6, 'Marketing & Social Media', 'monthly'],
  ['Semrush', 'SEO', 'https://semrush.com', 130, 'Marketing & Social Media', 'monthly'],
  ['HubSpot', 'CRM', 'https://hubspot.com', 18, 'Sales & CRM', 'monthly'],
  ['Pipedrive', 'CRM', 'https://pipedrive.com', 14, 'Sales & CRM', 'monthly'],
  ['Holded', 'Accounting', 'https://holded.com', 15, 'Finance & Accounting', 'monthly'],
  ['1Password', 'Password Manager', 'https://1password.com', 3, 'Security & Privacy', 'yearly'],
  ['Bitwarden', 'Password Manager', 'https://bitwarden.com', 0, 'Security & Privacy', 'yearly'],
  ['NordVPN', 'VPN', 'https://nordvpn.com', 5, 'Security & Privacy', 'yearly'],
  ['Domestika', 'Online Courses', 'https://domestika.org', 8, 'Education & Learning', 'yearly'],
  ['Udemy', 'Online Courses', 'https://udemy.com', 0, 'Education & Learning', 'monthly'],
  ['Platzi', 'Online Courses', 'https://platzi.com', 25, 'Education & Learning', 'monthly'],
  ['Duolingo', 'Languages', 'https://duolingo.com', 7, 'Education & Learning', 'yearly'],
  ['Netflix', 'Streaming', 'https://netflix.com', 13, 'Entertainment & Streaming', 'monthly'],
  ['Spotify', 'Music', 'https://spotify.com', 11, 'Entertainment & Streaming', 'monthly'],
  ['Disney+', 'Streaming', 'https://disneyplus.com', 10, 'Entertainment & Streaming', 'monthly'],
  ['YouTube Premium', 'Streaming', 'https://youtube.com/premium', 14, 'Entertainment & Streaming', 'monthly'],
];

const byName = Object.fromEntries(CATALOG.map((c) => [c[0], c]));

/** Herramientas de la usuaria demo: [nombre, días hasta la renovación, ciclo, plan] */
const DEMO_USER_TOOLS = [
  ['Figma', 3, 'monthly', 'Professional'],
  ['Adobe Creative Cloud', 9, 'monthly', 'Todas las apps'],
  ['Notion', 14, 'monthly', 'Plus'],
  ['Slack', 21, 'monthly', 'Pro'],
  ['ChatGPT', 5, 'monthly', 'Plus'],
  ['Claude', 18, 'monthly', 'Pro'],
  ['Toggl Track', 27, 'monthly', 'Starter'],
  ['Trello', 40, 'monthly', 'Standard'],
  ['Microsoft 365', 62, 'yearly', 'Personal'],
  ['1Password', 120, 'yearly', 'Individual'],
  ['Domestika', 200, 'yearly', 'Plus'],
  ['Spotify', 11, 'monthly', 'Premium'],
  ['Netflix', 24, 'monthly', 'Estándar'],
  ['Canva', null, null, null],
  ['VS Code', null, null, null],
  ['Discord', null, null, null],
];

const PEOPLE = [
  'Carlos Ruiz', 'María López', 'Javier Gómez', 'Laura Fernández', 'Pablo Sánchez', 'Elena Díaz',
  'Sergio Moreno', 'Carmen Romero', 'David Navarro', 'Marta Gil', 'Alejandro Ortiz', 'Paula Castro',
  'Daniel Rubio', 'Sara Molina', 'Adrián Delgado', 'Irene Vega', 'Raúl Herrera', 'Nuria Ramos',
  'Iván Medina', 'Cristina Prieto', 'Hugo Cabrera', 'Alba Santos',
];

const emailOf = (name) =>
  name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '.') + '@example.com';

/** Construye todos los registros (sin tocar la BD). */
export const buildDemoData = (now = new Date(), categoryIdByName = {}) => {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const random = createRandom(Number(today.toISOString().slice(0, 10).replace(/-/g, '')));
  const daysAgo = (d) => new Date(today.getTime() - d * DAY_MS + random.int(8, 20) * 3600 * 1000);
  const daysAhead = (d) => new Date(today.getTime() + d * DAY_MS);

  const users = [];
  const tools = [];
  const subscriptions = [];
  const movements = [];

  const addTool = (user, [name, type, url, price, category], createdAt) => {
    const tool = {
      id: randomUUID(),
      name,
      type,
      url,
      price: price || 0,
      description: null,
      status: random.chance(0.06) ? 'INACTIVE' : 'ACTIVE',
      categoryId: categoryIdByName[category] || null,
      userId: user.id,
      createdAt,
      updatedAt: createdAt,
    };
    tools.push(tool);
    movements.push({
      id: randomUUID(), toolId: tool.id, userId: user.id, type: 'CREATED',
      description: `Tool "${name}" was created`, createdAt,
    });
    return tool;
  };

  const addSubscription = (user, tool, { cycle, renewInDays, plan, status = 'ACTIVE' }) => {
    const price = cycle === 'yearly' ? Math.round(tool.price * 10 * 100) / 100 : tool.price;
    subscriptions.push({
      id: randomUUID(), toolId: tool.id, userId: user.id, price, billingCycle: cycle,
      plan: plan || null, status, renewalDate: daysAhead(renewInDays), createdAt: tool.createdAt, updatedAt: tool.createdAt,
    });
  };

  // Cuentas de demo
  const [demoAdmin, demoUser] = DEMO_ACCOUNTS.map((account, i) => {
    const user = {
      id: randomUUID(), email: account.email, name: account.name, role: account.role,
      language: 'es', isBlocked: false, renewalReminders: true, createdAt: daysAgo(330 - i * 40),
    };
    users.push(user);
    return user;
  });

  DEMO_USER_TOOLS.forEach(([name, renewIn, cycle, plan], i) => {
    const tool = addTool(demoUser, byName[name], daysAgo(170 - i * 9));
    tool.status = 'ACTIVE';
    if (renewIn !== null) addSubscription(demoUser, tool, { cycle, renewInDays: renewIn, plan });
  });
  // Algún cambio de precio para que el historial tenga de todo
  const figma = tools.find((t) => t.userId === demoUser.id && t.name === 'Figma');
  movements.push({ id: randomUUID(), toolId: figma.id, userId: demoUser.id, type: 'PRICE_CHANGE', description: 'Price of "Figma" changed from 12 to 15', createdAt: daysAgo(35) });

  ['Notion', 'Canva', 'Toggl Track'].forEach((name, i) => {
    const tool = addTool(demoAdmin, byName[name], daysAgo(300 - i * 30));
    if (byName[name][3] > 0) addSubscription(demoAdmin, tool, { cycle: 'monthly', renewInDays: 6 + i * 10, plan: 'Team' });
  });

  // Resto de usuarios: altas repartidas en el último año (más en los meses recientes)
  PEOPLE.forEach((name, i) => {
    const age = Math.round(360 * Math.pow((PEOPLE.length - i) / PEOPLE.length, 1.4)) + random.int(0, 12);
    const user = {
      id: randomUUID(), email: emailOf(name), name, role: i === 0 ? 'ADMIN' : 'USER',
      language: random.chance(0.85) ? 'es' : 'en', isBlocked: i === 7 || i === 15,
      renewalReminders: random.chance(0.8), createdAt: daysAgo(age),
    };
    users.push(user);

    random.sample(CATALOG, random.int(3, 10)).forEach((item) => {
      const tool = addTool(user, item, daysAgo(random.int(0, Math.max(0, age - 1))));
      if (item[3] > 0 && random.chance(0.75)) {
        const roll = random.next();
        addSubscription(user, tool, {
          cycle: item[5] === 'yearly' && random.chance(0.7) ? 'yearly' : 'monthly',
          renewInDays: random.int(1, 60),
          status: roll < 0.84 ? 'ACTIVE' : roll < 0.95 ? 'INACTIVE' : 'ARCHIVED',
        });
      }
      if (random.chance(0.25)) {
        movements.push({
          id: randomUUID(), toolId: tool.id, userId: user.id, type: 'UPDATED',
          description: `Tool "${tool.name}" was updated`,
          createdAt: new Date(Math.min(Date.now(), tool.createdAt.getTime() + random.int(1, 40) * DAY_MS)),
        });
      }
    });
  });

  return { users, tools, subscriptions, movements };
};

/**
 * Borra todos los datos y carga la demo. Solo para la web de demo.
 * @returns {Promise<{users: number, tools: number, subscriptions: number, movements: number}>}
 */
export const resetDemoData = async (prisma, now = new Date()) => {
  // Las categorías por defecto deben existir (normalmente las crea la migración)
  for (const { name, description } of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name, description } });
  }
  const categories = await prisma.category.findMany({ select: { id: true, name: true } });
  const categoryIdByName = Object.fromEntries(categories.map((c) => [c.name, c.id]));

  const data = buildDemoData(now, categoryIdByName);
  const demoHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  // El resto de usuarios de ejemplo no pueden iniciar sesión (contraseña aleatoria)
  const lockedHash = await bcrypt.hash(randomUUID(), 10);
  const demoEmails = new Set(DEMO_ACCOUNTS.map((a) => a.email));

  await prisma.$transaction([
    prisma.movement.deleteMany(),
    prisma.subscription.deleteMany(),
    prisma.tool.deleteMany(),
    prisma.user.deleteMany(),
    prisma.user.createMany({
      data: data.users.map((u) => ({ ...u, password: demoEmails.has(u.email) ? demoHash : lockedHash })),
    }),
    prisma.tool.createMany({ data: data.tools }),
    prisma.subscription.createMany({ data: data.subscriptions }),
    prisma.movement.createMany({ data: data.movements }),
  ], { timeout: 60000 });

  return {
    users: data.users.length,
    tools: data.tools.length,
    subscriptions: data.subscriptions.length,
    movements: data.movements.length,
  };
};
