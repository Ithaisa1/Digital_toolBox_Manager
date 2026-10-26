-- Categorías por defecto (herramientas y suscripciones).
-- Las que ya existan con el mismo nombre se dejan como están.
INSERT INTO "categories" ("id", "name", "description", "createdAt", "updatedAt") VALUES
  (gen_random_uuid()::text, 'Design', 'Figma, Photoshop, Illustrator, InDesign, Canva, Lightroom', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Video & Audio', 'Premiere Pro, After Effects, DaVinci Resolve, Final Cut Pro, CapCut', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Development', 'GitHub, VS Code, Cursor, JetBrains, Postman', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Hosting & Cloud', 'Vercel, Netlify, AWS, Hostinger, Cloudflare', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Project Management', 'Trello, Asana, Jira, ClickUp, Monday, Linear', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Time Tracking', 'Toggl Track, Clockify, Harvest', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Communication', 'Slack, Microsoft Teams, Zoom, Discord, Google Meet', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Productivity', 'Notion, Evernote, Todoist, Obsidian, Miro', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Office & Documents', 'Microsoft 365, Google Workspace, Adobe Acrobat', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Cloud Storage', 'Dropbox, Google Drive, OneDrive, iCloud+', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'AI & Machine Learning', 'ChatGPT, Claude, Gemini, Midjourney, Perplexity', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Marketing & Social Media', 'Mailchimp, Hootsuite, Buffer, Semrush', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Sales & CRM', 'HubSpot, Salesforce, Pipedrive', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Finance & Accounting', 'Holded, QuickBooks, Stripe', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Security & Privacy', '1Password, Bitwarden, NordVPN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Education & Learning', 'Udemy, Coursera, Domestika, Platzi, Duolingo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Entertainment & Streaming', 'Netflix, Spotify, Disney+, HBO Max, YouTube Premium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Other', 'Cualquier otra herramienta o suscripción', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;
