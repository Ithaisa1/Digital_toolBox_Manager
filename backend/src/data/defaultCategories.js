/**
 * Categorías por defecto de Dexa Manager.
 * `name` se guarda en la base de datos (en inglés); `es` es su nombre en español.
 * La migración *_default_categories las crea en cualquier base de datos nueva.
 * Si cambias esta lista, añade una migración nueva y actualiza las traducciones (categoryNames).
 */
export const DEFAULT_CATEGORIES = [
  { name: "Design", es: "Diseño", description: "Figma, Photoshop, Illustrator, InDesign, Canva, Lightroom" },
  { name: "Video & Audio", es: "Vídeo y audio", description: "Premiere Pro, After Effects, DaVinci Resolve, Final Cut Pro, CapCut" },
  { name: "Development", es: "Desarrollo", description: "GitHub, VS Code, Cursor, JetBrains, Postman" },
  { name: "Hosting & Cloud", es: "Hosting y nube", description: "Vercel, Netlify, AWS, Hostinger, Cloudflare" },
  { name: "Project Management", es: "Gestión de proyectos", description: "Trello, Asana, Jira, ClickUp, Monday, Linear" },
  { name: "Time Tracking", es: "Control de tiempo", description: "Toggl Track, Clockify, Harvest" },
  { name: "Communication", es: "Comunicación", description: "Slack, Microsoft Teams, Zoom, Discord, Google Meet" },
  { name: "Productivity", es: "Productividad", description: "Notion, Evernote, Todoist, Obsidian, Miro" },
  { name: "Office & Documents", es: "Ofimática y documentos", description: "Microsoft 365, Google Workspace, Adobe Acrobat" },
  { name: "Cloud Storage", es: "Almacenamiento en la nube", description: "Dropbox, Google Drive, OneDrive, iCloud+" },
  { name: "AI & Machine Learning", es: "Inteligencia artificial", description: "ChatGPT, Claude, Gemini, Midjourney, Perplexity" },
  { name: "Marketing & Social Media", es: "Marketing y redes sociales", description: "Mailchimp, Hootsuite, Buffer, Semrush" },
  { name: "Sales & CRM", es: "Ventas y CRM", description: "HubSpot, Salesforce, Pipedrive" },
  { name: "Finance & Accounting", es: "Finanzas y contabilidad", description: "Holded, QuickBooks, Stripe" },
  { name: "Security & Privacy", es: "Seguridad y privacidad", description: "1Password, Bitwarden, NordVPN" },
  { name: "Education & Learning", es: "Formación", description: "Udemy, Coursera, Domestika, Platzi, Duolingo" },
  { name: "Entertainment & Streaming", es: "Ocio y streaming", description: "Netflix, Spotify, Disney+, HBO Max, YouTube Premium" },
  { name: "Other", es: "Otros", description: "Cualquier otra herramienta o suscripción" },
];
