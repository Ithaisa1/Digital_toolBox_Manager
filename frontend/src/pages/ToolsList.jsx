import { useState, useEffect, useMemo, useRef } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { formatEuro } from '../utils/formatCurrency';
import { getToolDescription } from '../utils/productDescriptions';
import { categoryLabel, sortCategories } from '../utils/categories';
import Pagination from '../components/Pagination';
import ImportToolsModal from '../components/ImportToolsModal';
import { usePagination } from '../hooks/usePagination';
import './ToolsList.css';

const TOOLS_PER_PAGE = 12;

const TOOL_TYPES = {
  FREE: 'free',
  PAID: 'paid'
};

const getFallbackLogo = (name = 'DM') => {
  const initials = (name || 'DM')
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
      <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-family="Segoe UI, Arial, sans-serif" font-size="44" font-weight="700">${initials}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};

const Modal = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef(null);
  
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

const TOOLS_CATALOG = [
  { name: 'ChatGPT', type: 'AI Assistant', url: 'https://chat.openai.com', price: 20, description: 'Asistente IA de OpenAI', category: 'AI & Machine Learning' },
  { name: 'Claude', type: 'AI Assistant', url: 'https://claude.ai', price: 20, description: 'Asistente IA de Anthropic', category: 'AI & Machine Learning' },
  { name: 'Figma', type: 'Design Tool', url: 'https://figma.com', price: 15, description: 'Diseño colaborativo', category: 'Design' },
  { name: 'Notion', type: 'Productivity', url: 'https://notion.so', price: 10, description: 'Espacio de trabajo todo-en-uno', category: 'Productivity' },
  { name: 'Slack', type: 'Communication', url: 'https://slack.com', price: 8, description: 'Comunicación de equipo', category: 'Communication' },
  { name: 'Canva', type: 'Design Tool', url: 'https://canva.com', price: 0, description: 'Diseño gráfico fácil', category: 'Design' },
  { name: 'GitHub', type: 'Development', url: 'https://github.com', price: 0, description: 'Control de versiones', category: 'Development' },
  { name: 'VS Code', type: 'IDE', url: 'https://code.visualstudio.com', price: 0, description: 'Editor de código', category: 'Development' },
  { name: 'Midjourney', type: 'AI Art', url: 'https://midjourney.com', price: 10, description: 'Generación de imágenes con IA', category: 'AI & Machine Learning' },
  { name: 'Miro', type: 'Collaboration', url: 'https://miro.com', price: 0, description: 'Pizarra colaborativa', category: 'Productivity' },
  { name: 'Trello', type: 'Project Management', url: 'https://trello.com', price: 0, description: 'Gestión de proyectos', category: 'Project Management' },
  { name: 'Zoom', type: 'Video Conferencing', url: 'https://zoom.us', price: 15, description: 'Videoconferencias', category: 'Communication' },
  { name: 'Jira', type: 'Project Management', url: 'https://jira.com', price: 10, description: 'Gestión ágil de proyectos', category: 'Project Management' },
  { name: 'Linear', type: 'Project Management', url: 'https://linear.app', price: 8, description: 'Gestión de issues moderna', category: 'Project Management' },
  { name: 'Raycast', type: 'Productivity', url: 'https://raycast.com', price: 0, description: 'Launcher para Mac', category: 'Productivity' },
  { name: 'Obsidian', type: 'Notes', url: 'https://obsidian.md', price: 0, description: 'Notas en markdown', category: 'Productivity' },
  { name: 'Grammarly', type: 'Writing', url: 'https://grammarly.com', price: 12, description: 'Asistente de escritura', category: 'Productivity' },
  { name: 'Loom', type: 'Video', url: 'https://loom.com', price: 0, description: 'Videos rápidos', category: 'Communication' },
  { name: 'Adobe Photoshop', type: 'Design Tool', url: 'https://adobe.com/photoshop', price: 22, description: 'Edición de fotos profesional', category: 'Design' },
  { name: 'Photopea', type: 'Design Tool', url: 'https://photopea.com', price: 0, description: 'Editor de fotos online gratuito', category: 'Design' },
  { name: 'Framer', type: 'Design Tool', url: 'https://framer.com', price: 0, description: 'Diseño web interactivo', category: 'Design' },
  { name: 'Webflow', type: 'Design Tool', url: 'https://webflow.com', price: 14, description: 'Diseño web sin código', category: 'Design' },
  { name: 'Airtable', type: 'Productivity', url: 'https://airtable.com', price: 10, description: 'Base de datos flexible', category: 'Productivity' },
  { name: 'Asana', type: 'Project Management', url: 'https://asana.com', price: 11, description: 'Gestión de trabajo', category: 'Project Management' },
  { name: 'Monday', type: 'Project Management', url: 'https://monday.com', price: 9, description: 'Gestión de equipos', category: 'Project Management' },
  { name: 'Discord', type: 'Communication', url: 'https://discord.com', price: 0, description: 'Comunicación en comunidad', category: 'Communication' },
  { name: 'Dropbox', type: 'Productivity', url: 'https://dropbox.com', price: 12, description: 'Almacenamiento en la nube', category: 'Cloud Storage' },
  { name: 'Google Drive', type: 'Productivity', url: 'https://drive.google.com', price: 2, description: 'Almacenamiento y documentos', category: 'Cloud Storage' },
  { name: 'Todoist', type: 'Productivity', url: 'https://todoist.com', price: 4, description: 'Gestión de tareas', category: 'Productivity' },
  { name: 'ClickUp', type: 'Project Management', url: 'https://clickup.com', price: 7, description: 'Gestión de proyectos todo-en-uno', category: 'Project Management' },
  { name: 'Cursor', type: 'IDE', url: 'https://cursor.com', price: 0, description: 'Editor de código con IA', category: 'Development' },
  { name: 'Warp', type: 'Productivity', url: 'https://warp.dev', price: 0, description: 'Terminal moderna', category: 'Development' },
  { name: 'Tableur', type: 'Productivity', url: 'https://tableur.com', price: 0, description: 'Hojas de cálculo online', category: 'Office & Documents' },
  { name: 'Hugging Face', type: 'AI Platform', url: 'https://huggingface.co', price: 0, description: 'Plataforma de IA open source', category: 'AI & Machine Learning' },
  { name: 'Runway', type: 'AI Video', url: 'https://runwayml.com', price: 12, description: 'Edición de video con IA', category: 'AI & Machine Learning' },
  { name: 'Leonardo AI', type: 'AI Art', url: 'https://leonardo.ai', price: 10, description: 'Generación de imágenes con IA', category: 'AI & Machine Learning' },
  { name: 'Gemini', type: 'AI Assistant', url: 'https://gemini.google.com', price: 0, description: 'Asistente IA de Google', category: 'AI & Machine Learning' },
  { name: 'Perplexity', type: 'AI Search', url: 'https://perplexity.ai', price: 20, description: 'Búsqueda con IA', category: 'AI & Machine Learning' },
  // Más herramientas y suscripciones habituales (precios orientativos en €/mes)
  { name: "Adobe Illustrator", type: "Design Tool", url: "https://adobe.com/products/illustrator", price: 24, description: "Ilustración y gráficos vectoriales", category: "Design" },
  { name: "Adobe InDesign", type: "Design Tool", url: "https://adobe.com/products/indesign", price: 24, description: "Maquetación editorial", category: "Design" },
  { name: "Adobe Lightroom", type: "Photo Editing", url: "https://adobe.com/products/photoshop-lightroom", price: 12, description: "Edición y organización de fotos", category: "Design" },
  { name: "Adobe Creative Cloud", type: "Design Suite", url: "https://adobe.com/creativecloud", price: 66, description: "Todas las apps de Adobe", category: "Design" },
  { name: "Affinity", type: "Design Tool", url: "https://affinity.serif.com", price: 0, description: "Diseño, foto y maquetación", category: "Design" },
  { name: "Adobe Premiere Pro", type: "Video Editing", url: "https://adobe.com/products/premiere", price: 24, description: "Edición de vídeo profesional", category: "Video & Audio" },
  { name: "Adobe After Effects", type: "Motion Graphics", url: "https://adobe.com/products/aftereffects", price: 24, description: "Animación y efectos visuales", category: "Video & Audio" },
  { name: "DaVinci Resolve", type: "Video Editing", url: "https://blackmagicdesign.com/products/davinciresolve", price: 0, description: "Edición y color de vídeo", category: "Video & Audio" },
  { name: "CapCut", type: "Video Editing", url: "https://capcut.com", price: 0, description: "Edición de vídeo sencilla", category: "Video & Audio" },
  { name: "Toggl Track", type: "Time Tracking", url: "https://toggl.com/track", price: 9, description: "Registro de horas por proyecto", category: "Time Tracking" },
  { name: "Clockify", type: "Time Tracking", url: "https://clockify.me", price: 0, description: "Control de horas gratuito", category: "Time Tracking" },
  { name: "Harvest", type: "Time Tracking", url: "https://getharvest.com", price: 11, description: "Horas y facturación", category: "Time Tracking" },
  { name: "Microsoft Teams", type: "Communication", url: "https://teams.microsoft.com", price: 4, description: "Chat y reuniones de Microsoft", category: "Communication" },
  { name: "Google Meet", type: "Video Conferencing", url: "https://meet.google.com", price: 0, description: "Videollamadas de Google", category: "Communication" },
  { name: "Microsoft 365", type: "Office Suite", url: "https://microsoft.com/microsoft-365", price: 10, description: "Word, Excel, PowerPoint y Outlook", category: "Office & Documents" },
  { name: "Google Workspace", type: "Office Suite", url: "https://workspace.google.com", price: 7, description: "Gmail, Docs, Sheets y Drive para empresas", category: "Office & Documents" },
  { name: "Adobe Acrobat", type: "PDF", url: "https://adobe.com/acrobat", price: 18, description: "Crear y editar PDF", category: "Office & Documents" },
  { name: "Evernote", type: "Notes", url: "https://evernote.com", price: 11, description: "Notas y organización", category: "Productivity" },
  { name: "OneDrive", type: "Cloud Storage", url: "https://onedrive.live.com", price: 2, description: "Almacenamiento de Microsoft", category: "Cloud Storage" },
  { name: "iCloud+", type: "Cloud Storage", url: "https://icloud.com", price: 1, description: "Almacenamiento de Apple", category: "Cloud Storage" },
  { name: "Vercel", type: "Hosting", url: "https://vercel.com", price: 0, description: "Despliegue de webs y APIs", category: "Hosting & Cloud" },
  { name: "Netlify", type: "Hosting", url: "https://netlify.com", price: 0, description: "Hosting de webs estáticas", category: "Hosting & Cloud" },
  { name: "AWS", type: "Cloud Platform", url: "https://aws.amazon.com", price: 0, description: "Servicios en la nube de Amazon", category: "Hosting & Cloud" },
  { name: "Hostinger", type: "Hosting", url: "https://hostinger.com", price: 3, description: "Hosting y dominios", category: "Hosting & Cloud" },
  { name: "Mailchimp", type: "Email Marketing", url: "https://mailchimp.com", price: 13, description: "Campañas de email", category: "Marketing & Social Media" },
  { name: "Hootsuite", type: "Social Media", url: "https://hootsuite.com", price: 99, description: "Gestión de redes sociales", category: "Marketing & Social Media" },
  { name: "Buffer", type: "Social Media", url: "https://buffer.com", price: 6, description: "Programar publicaciones", category: "Marketing & Social Media" },
  { name: "Semrush", type: "SEO", url: "https://semrush.com", price: 130, description: "SEO y análisis de la competencia", category: "Marketing & Social Media" },
  { name: "HubSpot", type: "CRM", url: "https://hubspot.com", price: 0, description: "CRM y marketing", category: "Sales & CRM" },
  { name: "Pipedrive", type: "CRM", url: "https://pipedrive.com", price: 14, description: "Embudo de ventas", category: "Sales & CRM" },
  { name: "Holded", type: "Accounting", url: "https://holded.com", price: 15, description: "Facturación y contabilidad", category: "Finance & Accounting" },
  { name: "QuickBooks", type: "Accounting", url: "https://quickbooks.intuit.com", price: 15, description: "Contabilidad para pymes", category: "Finance & Accounting" },
  { name: "Stripe", type: "Payments", url: "https://stripe.com", price: 0, description: "Pagos online", category: "Finance & Accounting" },
  { name: "1Password", type: "Password Manager", url: "https://1password.com", price: 3, description: "Gestor de contraseñas", category: "Security & Privacy" },
  { name: "Bitwarden", type: "Password Manager", url: "https://bitwarden.com", price: 0, description: "Gestor de contraseñas open source", category: "Security & Privacy" },
  { name: "NordVPN", type: "VPN", url: "https://nordvpn.com", price: 5, description: "VPN y privacidad", category: "Security & Privacy" },
  { name: "Udemy", type: "Online Courses", url: "https://udemy.com", price: 0, description: "Cursos online", category: "Education & Learning" },
  { name: "Coursera", type: "Online Courses", url: "https://coursera.org", price: 49, description: "Cursos y certificados universitarios", category: "Education & Learning" },
  { name: "Domestika", type: "Online Courses", url: "https://domestika.org", price: 8, description: "Cursos creativos", category: "Education & Learning" },
  { name: "Platzi", type: "Online Courses", url: "https://platzi.com", price: 25, description: "Cursos de tecnología", category: "Education & Learning" },
  { name: "Duolingo", type: "Languages", url: "https://duolingo.com", price: 0, description: "Aprender idiomas", category: "Education & Learning" },
  { name: "Netflix", type: "Streaming", url: "https://netflix.com", price: 13, description: "Series y películas", category: "Entertainment & Streaming" },
  { name: "Spotify", type: "Music", url: "https://spotify.com", price: 11, description: "Música y podcasts", category: "Entertainment & Streaming" },
  { name: "Disney+", type: "Streaming", url: "https://disneyplus.com", price: 10, description: "Series y películas de Disney", category: "Entertainment & Streaming" },
  { name: "HBO Max", type: "Streaming", url: "https://max.com", price: 10, description: "Series y películas de HBO", category: "Entertainment & Streaming" },
  { name: "YouTube Premium", type: "Streaming", url: "https://youtube.com/premium", price: 14, description: "YouTube sin anuncios", category: "Entertainment & Streaming" },
  { name: "Amazon Prime", type: "Streaming", url: "https://amazon.es/prime", price: 5, description: "Envíos y Prime Video", category: "Entertainment & Streaming" },
];

const AddToolModal = ({ isOpen, onClose, onToolAdded, categories }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    url: '',
    price: '',
    categoryId: '',
    toolType: 'paid'
  });
  
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { t, i18n } = useTranslation();
  const isSpanish = i18n.language?.startsWith('es');
  
  const copy = {
    addTool: isSpanish ? 'Añadir herramienta' : 'Add tool',
    searchPlaceholder: isSpanish ? 'Buscar por nombre, tipo o categoría...' : 'Search by name, type or category...',
    name: isSpanish ? 'Nombre' : 'Name',
    description: isSpanish ? 'Descripción' : 'Description',
    type: isSpanish ? 'Tipo' : 'Type',
    url: 'URL',
    price: isSpanish ? 'Precio (€/mes)' : 'Price (€/month)',
    category: isSpanish ? 'Categoría' : 'Category',
    free: isSpanish ? 'Gratis' : 'Free',
    paid: isSpanish ? 'De pago' : 'Paid',
    selectCategory: isSpanish ? 'Seleccionar categoría' : 'Select category',
    create: isSpanish ? 'Crear' : 'Create',
    cancel: isSpanish ? 'Cancelar' : 'Cancel',
    back: isSpanish ? 'Volver' : 'Back',
    noSuggestions: isSpanish ? 'No hay sugerencias' : 'No suggestions',
    popularTools: isSpanish ? 'Herramientas populares' : 'Popular tools',
    searchResults: isSpanish ? 'Resultados de búsqueda' : 'Search results',
    manualAdd: isSpanish ? 'Añadir manualmente' : 'Add manually',
    hint: isSpanish ? 'Escribe para buscar...' : 'Type to search...',
  };
  
  useEffect(() => {
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      const filtered = TOOLS_CATALOG.filter(tool => 
        tool.name.toLowerCase().includes(query) ||
        tool.type.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.category.toLowerCase().includes(query) ||
        categoryLabel(t, tool.category).toLowerCase().includes(query)
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [debouncedSearch, t]);
  
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSuggestions([]);
      setShowForm(false);
      setFormData({
        name: '',
        description: '',
        type: '',
        url: '',
        price: '',
        categoryId: '',
        toolType: 'paid'
      });
    }
  }, [isOpen]);

  const handleSelectSuggested = (tool) => {
    setFormData({
      ...formData,
      name: tool.name,
      description: tool.description,
      type: tool.type,
      url: tool.url,
      price: tool.price?.toString() || '',
      // Rellenar la categoría sugerida si existe en la base de datos
      categoryId: categories.find((c) => c.name === tool.category)?.id || formData.categoryId,
      toolType: tool.price === 0 ? 'free' : 'paid'
    });
    setShowForm(true);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const toolData = {
        ...formData,
        price:
          formData.toolType === 'free'
            ? 0
            : formData.price
            ? parseFloat(formData.price)
            : null,
      };

      const response = await api.post('/tools', toolData);
      onToolAdded(response.data);
      onClose();
    } catch (err) {
      console.error('Failed to create tool:', err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={copy.addTool}>
      <div className="add-tool-modal">
        {!showForm ? (
          <>
            <div className="search-suggestions">
              <div className="search-box">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder={copy.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                  autoFocus
                />
              </div>
              
              {suggestions.length > 0 ? (
                <div className="suggestions-list">
                  <p className="suggestions-title">{copy.searchResults}</p>
                  {suggestions.map((tool, index) => (
                    <button
                      key={index}
                      className="suggestion-item"
                      onClick={() => handleSelectSuggested(tool)}
                    >
                      <img 
                        src={getFallbackLogo(tool.name)} 
                        alt="" 
                        className="suggestion-icon"
                      />
                      <div className="suggestion-info">
                        <span className="suggestion-name">{tool.name}</span>
                        <span className="suggestion-type">{tool.type}</span>
                      </div>
                      <span className={`tool-type-badge ${tool.price === 0 ? 'free' : 'paid'}`}>
                        {tool.price === 0 ? copy.free : `€${tool.price}/mo`}
                      </span>
                    </button>
                  ))}
                </div>
              ) : debouncedSearch.trim() ? (
                <div className="no-suggestions">
                  <p>{copy.noSuggestions}</p>
                  <button 
                    className="btn btn-outline"
                    onClick={() => {
                      setFormData({...formData, name: debouncedSearch});
                      setShowForm(true);
                    }}
                  >
                    {copy.manualAdd}
                  </button>
                </div>
              ) : (
                <div className="all-suggestions">
                  <p className="suggestions-title">{copy.popularTools}</p>
                  <div className="suggestions-grid">
                    {TOOLS_CATALOG.slice(0, 12).map((tool, index) => (
                      <button
                        key={index}
                        className="suggestion-chip"
                        onClick={() => handleSelectSuggested(tool)}
                      >
                        <img 
                          src={getFallbackLogo(tool.name)} 
                          alt="" 
                          className="chip-icon"
                        />
                        <span>{tool.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="tool-form">
            <div className="form-group">
              <label>{copy.name}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div className="form-group">
              <label>{copy.description}</label>
              <textarea
                rows="2"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>{copy.type}</label>
                <input
                  type="text"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>{copy.price}</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>{copy.url}</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>
            
            <div className="form-group">
              <label>{copy.category}</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              >
                <option value="">{copy.selectCategory}</option>
                {sortCategories(categories, t, i18n.language).map((cat) => (
                  <option key={cat.id} value={cat.id}>{categoryLabel(t, cat.name)}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Tipo de herramienta</label>
              <div className="tool-type-selector">
                <label className="type-option">
                  <input
                    type="radio"
                    name="toolType"
                    value="free"
                    checked={formData.toolType === 'free'}
                    onChange={(e) => setFormData({ ...formData, toolType: e.target.value })}
                  />
                  <span className="type-label free">{copy.free}</span>
                </label>
                <label className="type-option">
                  <input
                    type="radio"
                    name="toolType"
                    value="paid"
                    checked={formData.toolType === 'paid'}
                    onChange={(e) => setFormData({ ...formData, toolType: e.target.value })}
                  />
                  <span className="type-label paid">{copy.paid}</span>
                </label>
              </div>
            </div>
            
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                {copy.back}
              </button>
              <button type="submit" className="btn btn-primary">
                {copy.create}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

const ToolsList = () => {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subscriptionPanel, setSubscriptionPanel] = useState(null);
  const [subscriptionForm, setSubscriptionForm] = useState({
    price: '',
    plan: '',
    billingCycle: 'monthly',
    renewalDate: '',
  });
  const [recentlyAdded, setRecentlyAdded] = useState([]);
  
  const { t, i18n } = useTranslation();
  const isSpanish = i18n.language?.startsWith('es');
  
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  const copy = isSpanish
    ? {
        title: 'Mi Inventario',
        subtitle: 'Gestiona todas tus herramientas digitales en un solo lugar',
        addTool: '+ Añadir herramienta',
        searchPlaceholder: 'Buscar herramientas...',
        filters: {
          all: 'Todas',
          free: 'Gratis',
          paid: 'De pago',
        },
        allCategories: 'Todas las categorías',
        status: {
          free: 'Gratis',
          subscribed: 'Suscrito',
          notSubscribed: 'Suscribirse',
        },
        actions: {
          useTool: 'Usar',
          openTool: 'Abrir',
          subscribe: 'Suscribirse',
          manage: 'Gestionar',
          delete: 'Eliminar',
        },
        subscription: {
          title: 'Gestionar Suscripción',
          price: 'Precio',
          plan: 'Plan',
          billingCycle: 'Facturación',
          renewalDate: 'Renovación',
          monthly: 'Mensual',
          yearly: 'Anual',
          save: 'Guardar',
          create: 'Crear',
          cancel: 'Cancelar suscripción',
          close: 'Cerrar',
          confirmCancel: '¿Cancelar esta suscripción?',
        },
        noTools: 'No hay herramientas en tu inventario',
        noResults: 'No se encontraron herramientas',
        category: 'Categoría',
        uncategorized: 'Sin categoría',
        loadFailed: 'Error al cargar herramientas',
        recentlyAdded: 'Añadidas recientemente',
      }
    : {
        title: 'My Inventory',
        subtitle: 'Manage all your digital tools in one place',
        addTool: '+ Add tool',
        searchPlaceholder: 'Search tools...',
        filters: {
          all: 'All',
          free: 'Free',
          paid: 'Paid',
        },
        allCategories: 'All categories',
        status: {
          free: 'Free',
          subscribed: 'Subscribed',
          notSubscribed: 'Subscribe',
        },
        actions: {
          useTool: 'Use',
          openTool: 'Open',
          subscribe: 'Subscribe',
          manage: 'Manage',
          delete: 'Delete',
        },
        subscription: {
          title: 'Manage Subscription',
          price: 'Price',
          plan: 'Plan',
          billingCycle: 'Billing',
          renewalDate: 'Renewal',
          monthly: 'Monthly',
          yearly: 'Yearly',
          save: 'Save',
          create: 'Create',
          cancel: 'Cancel subscription',
          close: 'Close',
          confirmCancel: 'Cancel this subscription?',
        },
        noTools: 'No tools in your inventory',
        noResults: 'No tools found',
        category: 'Category',
        uncategorized: 'Uncategorized',
        loadFailed: 'Failed to load tools',
        recentlyAdded: 'Recently added',
      };

  useEffect(() => {
    fetchTools();
    fetchCategories();
  }, []);

  const fetchTools = async () => {
    try {
      const response = await api.get('/tools');
      setTools(response.data);
    } catch (err) {
      setError(copy.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to load categories');
    }
  };

  const getActiveSubscription = (tool) => {
    return tool.subscriptions?.find((sub) => sub.status === 'ACTIVE') || null;
  };

  const hasActiveSubscription = (tool) => {
    return tool.subscriptions?.some(s => s.status === 'ACTIVE') || false;
  };

  const uniqueTools = useMemo(() => {
    const seen = new Map();
    return tools.filter((tool) => {
      const key = tool?.name?.trim().toLowerCase() || '';
      if (!key) return false;
      if (seen.has(key)) {
        const existing = seen.get(key);
        if (new Date(tool.createdAt) > new Date(existing.createdAt)) {
          seen.set(key, tool);
          return true;
        }
        return false;
      }
      seen.set(key, tool);
      return true;
    });
  }, [tools]);

  const filteredTools = useMemo(() => {
    let result = uniqueTools;

    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(
        (tool) =>
          tool.name?.toLowerCase().includes(query) ||
          tool.type?.toLowerCase().includes(query) ||
          tool.category?.name?.toLowerCase().includes(query) ||
          (tool.category && categoryLabel(t, tool.category.name).toLowerCase().includes(query)) ||
          tool.description?.toLowerCase().includes(query)
      );
    }

    result = result.filter((tool) => {
      const isFree = !tool.price || tool.price === 0;

      switch (activeFilter) {
        case 'free':
          return isFree;
        case 'paid':
          return !isFree;
        default:
          return true;
      }
    });

    if (selectedCategory !== 'all') {
      result = result.filter((tool) => tool.category?.id === selectedCategory);
    }

    return result;
  }, [uniqueTools, debouncedSearch, activeFilter, selectedCategory, t]);

  const {
    page,
    setPage,
    totalPages,
    total,
    pageItems: pagedTools,
  } = usePagination(filteredTools, TOOLS_PER_PAGE, `${debouncedSearch}|${activeFilter}|${selectedCategory}`);

  const handleToolAdded = (newTool) => {
    if (newTool) {
      setRecentlyAdded((prev) => [newTool, ...prev].slice(0, 3));
    }
    fetchTools();
  };

  const handleOpenSubscriptionPanel = (tool, existingSub = null) => {
    if (existingSub) {
      setSubscriptionForm({
        price: existingSub.price.toString(),
        plan: existingSub.plan || '',
        billingCycle: existingSub.billingCycle,
        renewalDate: existingSub.renewalDate?.split('T')[0] || '',
      });
    } else {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setSubscriptionForm({
        price: tool.price?.toString() || '',
        plan: '',
        billingCycle: 'monthly',
        renewalDate: nextMonth.toISOString().split('T')[0],
      });
    }
    setSubscriptionPanel({ tool, existingSub });
  };

  const handleSaveSubscription = async () => {
    if (!subscriptionPanel) return;

    const { tool, existingSub } = subscriptionPanel;
    try {
      if (existingSub) {
        await api.put(`/subscriptions/${existingSub.id}`, {
          ...subscriptionForm,
          price: parseFloat(subscriptionForm.price),
          renewalDate: subscriptionForm.renewalDate,
        });
      } else {
        await api.post('/subscriptions', {
          toolId: tool.id,
          ...subscriptionForm,
          price: parseFloat(subscriptionForm.price),
          renewalDate: subscriptionForm.renewalDate,
          status: 'ACTIVE',
        });
      }
      fetchTools();
      setSubscriptionPanel(null);
    } catch (err) {
      console.error('Failed to save subscription:', err);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscriptionPanel?.existingSub) return;

    if (window.confirm(copy.subscription.confirmCancel)) {
      try {
        await api.put(`/subscriptions/${subscriptionPanel.existingSub.id}`, {
          status: 'INACTIVE',
        });
        fetchTools();
        setSubscriptionPanel(null);
      } catch (err) {
        console.error('Failed to cancel subscription:', err);
      }
    }
  };

  const handleOpenTool = (tool) => {
    if (tool.url) {
      window.open(tool.url, '_blank');
    }
  };

  const handleDeleteTool = async (tool) => {
    if (window.confirm(isSpanish ? `¿Eliminar "${tool.name}"?` : `Delete "${tool.name}"?`)) {
      try {
        await api.delete(`/tools/${tool.id}`);
        fetchTools();
      } catch (err) {
        console.error('Failed to delete tool:', err);
      }
    }
  };

  if (loading) return <div className="loading">{t('common.loading')}</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="tools-container">
      <div className="tools-header">
        <div className="tools-header-copy">
          <h1>{copy.title}</h1>
          <p className="tools-subtitle">{copy.subtitle}</p>
        </div>
        <div className="tools-header-actions">
          <button className="btn btn-secondary" onClick={() => setShowImportModal(true)}>
            {t('import.button')}
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            {copy.addTool}
          </button>
        </div>
      </div>

      {recentlyAdded.length > 0 && (
        <div className="recently-added-section">
          <h2>{copy.recentlyAdded}</h2>
          <div className="recently-added-list">
            {recentlyAdded.map((tool) => (
              <div key={tool.id} className="recently-added-card">
                <span>{tool.name}</span>
                <small>{tool.category ? categoryLabel(t, tool.category.name) : copy.uncategorized}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="tools-filters">
        <div className="search-box">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder={copy.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters-row">
          <div className="filter-tabs">
            {Object.keys(copy.filters).map((filter) => (
              <button
                key={filter}
                className={`filter-tab ${activeFilter === filter ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {copy.filters[filter]}
              </button>
            ))}
          </div>

          <div className="category-filter">
            <div className="category-buttons">
              <button
                className={`category-tab ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                {copy.allCategories}
              </button>
              {sortCategories(categories, t, i18n.language).map((category) => (
                <button
                  key={category.id}
                  title={category.description || undefined}
                  className={`category-tab ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {categoryLabel(t, category.name)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {filteredTools.length === 0 ? (
        <div className="empty-state">
          <p>{copy.noResults}</p>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            {copy.addTool}
          </button>
        </div>
      ) : (
        <>
        <div className="tools-grid">
          {pagedTools.map((tool) => {
            const isFree = !tool.price || tool.price === 0;
            const subscribed = hasActiveSubscription(tool);
            const activeSub = getActiveSubscription(tool);
            const toolStatus = tool.status?.toLowerCase() || 'active';

            const getStatusBadgeClass = () => {
              if (isFree) return 'free';
              if (toolStatus === 'inactive') return 'inactive';
              if (toolStatus === 'archived') return 'archived';
              return subscribed ? 'subscribed' : 'notSubscribed';
            };

            const getStatusLabel = () => {
              if (isFree) return copy.status.free;
              if (toolStatus === 'inactive') return isSpanish ? 'Inactiva' : 'Inactive';
              if (toolStatus === 'archived') return isSpanish ? 'Archivada' : 'Archived';
              return subscribed ? copy.status.subscribed : copy.status.notSubscribed;
            };

            return (
              <article key={tool.id} className={`tool-card status-${toolStatus}`}>
                <div className="tool-card-header">
                  <img
                    src={tool.logoUrl || getFallbackLogo(tool.name)}
                    alt={`${tool.name} logo`}
                    className="tool-icon"
                    onError={(event) => {
                      event.currentTarget.src = getFallbackLogo(tool.name);
                    }}
                  />
                  <div className="tool-badges">
                    <span className={`badge-status ${getStatusBadgeClass()}`}>
                      {getStatusLabel()}
                    </span>
                    {isFree && <span className="badge-free">FREE</span>}
                  </div>
                </div>

                <div className="tool-card-body">
                  <h3>{tool.name}</h3>
                  <p className="tool-description">
                    {tool.description || getToolDescription(tool) || tool.type || '-'}
                  </p>
                  <p className="tool-category">
                    {copy.category}: {tool.category?.name || copy.uncategorized}
                  </p>
                </div>

                {activeSub && (
                  <div className="tool-subscription-info">
                    <div className="sub-info-row">
                      <span className="sub-label">{copy.subscription.price}:</span>
                      <span className="sub-value">{formatEuro(activeSub.price)}</span>
                    </div>
                    <div className="sub-info-row">
                      <span className="sub-label">{copy.subscription.billingCycle}:</span>
                      <span className="sub-value">
                        {activeSub.billingCycle === 'yearly'
                          ? copy.subscription.yearly
                          : copy.subscription.monthly}
                      </span>
                    </div>
                    <div className="sub-info-row">
                      <span className="sub-label">{copy.subscription.renewalDate}:</span>
                      <span className="sub-value">
                        {new Date(activeSub.renewalDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}

                {tool.price && !isFree && (
                  <p className="tool-price">{formatEuro(tool.price)}/mo</p>
                )}

                <div className="tool-actions">
                  {isFree && (
                    <button
                      className="btn btn-primary"
                      onClick={() => handleOpenTool(tool)}
                    >
                      {copy.actions.useTool}
                    </button>
                  )}

                  {!isFree && subscribed && (
                    <>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleOpenTool(tool)}
                      >
                        {copy.actions.openTool}
                      </button>
                      <button
                        className="btn btn-outline"
                        onClick={() => handleOpenSubscriptionPanel(tool, activeSub)}
                      >
                        {copy.actions.manage}
                      </button>
                    </>
                  )}

                  {!isFree && !subscribed && (
                    <button
                      className="btn btn-primary"
                      onClick={() => handleOpenSubscriptionPanel(tool, null)}
                    >
                      {copy.actions.subscribe}
                    </button>
                  )}
                </div>

                <button
                  className="btn-delete-tool"
                  onClick={() => handleDeleteTool(tool)}
                  aria-label={copy.actions.delete}
                  title={copy.actions.delete}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                </button>
              </article>
            );
          })}
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={TOOLS_PER_PAGE}
          onPageChange={setPage}
        />
        </>
      )}

      <ImportToolsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImported={fetchTools}
      />

      <AddToolModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onToolAdded={handleToolAdded}
        categories={categories}
      />

      {subscriptionPanel && (
        <div className="subscription-panel-overlay" onClick={() => setSubscriptionPanel(null)}>
          <div className="subscription-panel" onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
              <h2>{copy.subscription.title}</h2>
              <button className="panel-close" onClick={() => setSubscriptionPanel(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="panel-tool-info">
              <img
                src={subscriptionPanel.tool.logoUrl || getFallbackLogo(subscriptionPanel.tool.name)}
                alt=""
                className="panel-tool-icon"
              />
              <div>
                <h3>{subscriptionPanel.tool.name}</h3>
              </div>
            </div>

            <div className="panel-form">
              <div className="form-group">
                <label>{copy.subscription.plan}</label>
                <input
                  type="text"
                  placeholder="e.g., Pro, Team, Enterprise"
                  value={subscriptionForm.plan}
                  onChange={(e) => setSubscriptionForm({ ...subscriptionForm, plan: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>{copy.subscription.price} (EUR)</label>
                <input
                  type="number"
                  step="0.01"
                  value={subscriptionForm.price}
                  onChange={(e) => setSubscriptionForm({ ...subscriptionForm, price: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>{copy.subscription.billingCycle}</label>
                <select
                  value={subscriptionForm.billingCycle}
                  onChange={(e) => setSubscriptionForm({ ...subscriptionForm, billingCycle: e.target.value })}
                >
                  <option value="monthly">{copy.subscription.monthly}</option>
                  <option value="yearly">{copy.subscription.yearly}</option>
                </select>
              </div>

              <div className="form-group">
                <label>{copy.subscription.renewalDate}</label>
                <input
                  type="date"
                  value={subscriptionForm.renewalDate}
                  onChange={(e) => setSubscriptionForm({ ...subscriptionForm, renewalDate: e.target.value })}
                />
              </div>
            </div>

            <div className="panel-actions">
              <button className="btn btn-primary" onClick={handleSaveSubscription}>
                {subscriptionPanel.existingSub ? copy.subscription.save : copy.subscription.create}
              </button>

              {subscriptionPanel.existingSub && (
                <button className="btn btn-danger" onClick={handleCancelSubscription}>
                  {copy.subscription.cancel}
                </button>
              )}

              <button className="btn btn-outline" onClick={() => setSubscriptionPanel(null)}>
                {copy.subscription.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolsList;