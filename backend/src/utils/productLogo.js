const FAVICON_BASE_URL = 'https://www.google.com/s2/favicons?sz=128&domain=';

const BRAND_DOMAIN_MAP = {
  adobe: 'adobe.com',
  'adobe creative cloud': 'adobe.com',
  aftereffects: 'adobe.com',
  'after effects': 'adobe.com',
  canva: 'canva.com',
  figma: 'figma.com',
  indesign: 'adobe.com',
  illustrator: 'adobe.com',
  lightroom: 'adobe.com',
  notion: 'notion.so',
  openai: 'openai.com',
  photoshop: 'adobe.com',
  slack: 'slack.com',
  trello: 'trello.com',
  'vs code': 'code.visualstudio.com',
  vscode: 'code.visualstudio.com',
};

const escapeXml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const getDomainFromUrl = (value) => {
  if (!value) return null;

  try {
    const normalized = value.startsWith('http://') || value.startsWith('https://')
      ? value
      : `https://${value}`;

    return new URL(normalized).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
};

export const getToolLogoUrl = (tool) => {
  const normalizedName = String(tool?.name || tool?.type || '')
    .trim()
    .toLowerCase();

  const domain = getDomainFromUrl(tool?.url) || BRAND_DOMAIN_MAP[normalizedName] || Object.entries(BRAND_DOMAIN_MAP).find(([key]) => normalizedName.includes(key))?.[1];

  if (domain) {
    return `${FAVICON_BASE_URL}${domain}`;
  }

  const initials = (tool?.name || 'TB')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#2563eb" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="28" fill="url(#g)" />
      <text
        x="50%"
        y="54%"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="#ffffff"
        font-family="Segoe UI, Arial, sans-serif"
        font-size="44"
        font-weight="700"
      >${escapeXml(initials)}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export const attachToolLogo = (tool) => {
  if (!tool) return tool;
  return {
    ...tool,
    logoUrl: getToolLogoUrl(tool),
  };
};

export const attachSubscriptionLogo = (subscription) => {
  if (!subscription) return subscription;
  return {
    ...subscription,
    tool: attachToolLogo(subscription.tool),
  };
};
