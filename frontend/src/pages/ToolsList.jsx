import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { formatEuro } from '../utils/formatCurrency';
import { getToolDescription } from '../utils/productDescriptions';
import './ToolsList.css';

const TOOL_TYPES = {
  FREE: 'free',
  PAID: 'paid',
  FREEMIUM: 'freemium'
};

const getFallbackLogo = (name = 'TB') => {
  const initials = (name || 'TB')
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

const AddToolModal = ({ isOpen, onClose, onToolAdded, categories }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'SaaS',
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
    searchPlaceholder: isSpanish ? 'Buscar herramientas sugeridas...' : 'Search suggested tools...',
    name: isSpanish ? 'Nombre' : 'Name',
    description: isSpanish ? 'Descripción' : 'Description',
    type: isSpanish ? 'Tipo' : 'Type',
    url: 'URL',
    price: isSpanish ? 'Precio (€/mes)' : 'Price (€/month)',
    category: isSpanish ? 'Categoría' : 'Category',
    free: isSpanish ? 'Gratis' : 'Free',
    paid: isSpanish ? 'De pago' : 'Paid',
    freemium: isSpanish ? 'Freemium' : 'Freemium',
    selectCategory: isSpanish ? 'Seleccionar categoría' : 'Select category',
    create: isSpanish ? 'Crear' : 'Create',
    cancel: isSpanish ? 'Cancelar' : 'Cancel',
    noSuggestions: isSpanish ? 'No hay sugerencias' : 'No suggestions'
  };
  
  const commonTools = [
    { name: 'ChatGPT', type: 'AI Assistant', url: 'https://chat.openai.com', price: 20, description: 'Asistente IA de OpenAI' },
    { name: 'Claude', type: 'AI Assistant', url: 'https://claude.ai', price: 20, description: 'Asistente IA de Anthropic' },
    { name: 'Figma', type: 'Design Tool', url: 'https://figma.com', price: 15, description: 'Diseño colaborativo' },
    { name: 'Notion', type: 'Productivity', url: 'https://notion.so', price: 10, description: 'Espacio de trabajo todo-en-uno' },
    { name: 'Slack', type: 'Communication', url: 'https://slack.com', price: 8, description: 'Comunicación de equipo' },
    { name: 'Canva', type: 'Design Tool', url: 'https://canva.com', price: 0, description: 'Diseño gráfico fácil' },
    { name: 'GitHub', type: 'Development', url: 'https://github.com', price: 0, description: 'Control de versiones' },
    { name: 'VS Code', type: 'IDE', url: 'https://code.visualstudio.com', price: 0, description: 'Editor de código' },
    { name: 'Midjourney', type: 'AI Art', url: 'https://midjourney.com', price: 10, description: 'Generación de imágenes con IA' },
    { name: 'Miro', type: 'Collaboration', url: 'https://miro.com', price: 0, description: 'Pizarra colaborativa' },
    { name: 'Trello', type: 'Project Management', url: 'https://trello.com', price: 0, description: 'Gestión de proyectos' },
    { name: 'Zoom', type: 'Video Conferencing', url: 'https://zoom.us', price: 15, description: 'Videoconferencias' },
    { name: 'Jira', type: 'Project Management', url: 'https://jira.com', price: 10, description: 'Gestión ágil de proyectos' },
    { name: 'Linear', type: 'Project Management', url: 'https://linear.app', price: 8, description: 'Gestión de issues moderna' },
    { name: 'Raycast', type: 'Productivity', url: 'https://raycast.com', price: 0, description: 'Launcher para Mac' },
    { name: 'Obsidian', type: 'Notes', url: 'https://obsidian.md', price: 0, description: 'Notas en markdown' },
    { name: 'Anki', type: 'Education', url: 'https://ankiweb.net', price: 0, description: 'Flashcards espaciadas' },
    { name: 'Duolingo', type: 'Education', url: 'https://duolingo.com', price: 0, description: 'Aprende idiomas' },
    { name: 'Grammarly', type: 'Writing', url: 'https://grammarly.com', price: 12, description: 'Asistente de escritura' },
    { name: 'Loom', type: 'Video', url: 'https://loom.com', price: 0, description: 'Videos rápidos' },
  ];
  
  useEffect(() => {
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      const filtered = commonTools.filter(tool => 
        tool.name.toLowerCase().includes(query) ||
        tool.type.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query)
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [debouncedSearch]);
  
  const getToolType = (price) => {
    if (!price || price === 0) return TOOL_TYPES.FREE;
    return TOOL_TYPES.PAID;
  };
  
  const handleSelectSuggested = (tool) => {
    setFormData({
      ...formData,
      name: tool.name,
      description: tool.description,
      type: tool.type,
      url: tool.url,
      price: tool.price?.toString() || '',
      toolType: getToolType(tool.price)
    });
    setShowForm(true);
    setSearchQuery('');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tools', {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null,
      });
      onToolAdded();
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
                      <span className={`tool-type-badge ${getToolType(tool.price)}`}>
                        {tool.price === 0 ? copy.free : `€${tool.price}/mo`}
                      </span>
                    </button>
                  ))}
                </div>
              ) : debouncedSearch.trim() ? (
                <div className="no-suggestions">
                  <p>{copy.noSuggestions}</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowForm(true)}
                  >
                    {copy.create} "{debouncedSearch}"
                  </button>
                </div>
              ) : (
                <div className="all-suggestions">
                  <p className="suggestions-hint">
                    {isSpanish ? 'Herramientas populares:' : 'Popular tools:'}
                  </p>
                  <div className="suggestions-grid">
                    {commonTools.slice(0, 8).map((tool, index) => (
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
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
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
                <label className="type-option">
                  <input
                    type="radio"
                    name="toolType"
                    value="freemium"
                    checked={formData.toolType === 'freemium'}
                    onChange={(e) => setFormData({ ...formData, toolType: e.target.value })}
                  />
                  <span className="type-label freemium">{copy.freemium}</span>
                </label>
              </div>
            </div>
            
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                {copy.cancel}
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
  const [showAddModal, setShowAddModal] = useState(false);
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
          freemium: 'Freemium',
          subscribed: 'Suscritas',
        },
        status: {
          free: 'Gratis',
          subscribed: 'Suscrito',
          notSubscribed: 'Suscribirse',
        },
        actions: {
          useTool: 'Usar herramienta',
          openTool: 'Abrir',
          subscribe: 'Suscribirse',
          manage: 'Gestionar',
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
          freemium: 'Freemium',
          subscribed: 'Subscribed',
        },
        status: {
          free: 'Free',
          subscribed: 'Subscribed',
          notSubscribed: 'Subscribe',
        },
        actions: {
          useTool: 'Use tool',
          openTool: 'Open',
          subscribe: 'Subscribe',
          manage: 'Manage',
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

  const getToolType = (tool) => {
    if (!tool.price || tool.price === 0) return TOOL_TYPES.FREE;
    const hasActiveSub = tool.subscriptions?.some(s => s.status === 'ACTIVE');
    if (hasActiveSub) return TOOL_TYPES.PAID;
    return TOOL_TYPES.PAID;
  };

  const getToolTypeClass = (tool) => {
    if (!tool.price || tool.price === 0) return 'free';
    return 'paid';
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
          tool.description?.toLowerCase().includes(query)
      );
    }

    result = result.filter((tool) => {
      const isFree = !tool.price || tool.price === 0;
      const subscribed = hasActiveSubscription(tool);

      switch (activeFilter) {
        case 'free':
          return isFree;
        case 'paid':
          return !isFree;
        case 'freemium':
          return !isFree;
        case 'subscribed':
          return subscribed;
        default:
          return true;
      }
    });

    return result;
  }, [uniqueTools, debouncedSearch, activeFilter]);

  const handleToolAdded = () => {
    fetchTools();
    setShowAddModal(false);
    const newTool = uniqueTools[0];
    if (newTool) {
      setRecentlyAdded(prev => [...prev.slice(-4), newTool.id]);
      setTimeout(() => {
        setRecentlyAdded(prev => prev.filter(id => id !== newTool.id));
      }, 3000);
    }
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
          status: 'CANCELLED',
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

  if (loading) return <div className="loading">{t('common.loading')}</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="tools-container">
      <div className="tools-header">
        <div className="tools-header-copy">
          <h1>{copy.title}</h1>
          <p className="tools-subtitle">{copy.subtitle}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          {copy.addTool}
        </button>
      </div>

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
      </div>

      {recentlyAdded.length > 0 && (
        <div className="recently-added-banner">
          <span>{copy.recentlyAdded}</span>
        </div>
      )}

      {filteredTools.length === 0 ? (
        <div className="empty-state">
          <p>{copy.noResults}</p>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            {copy.addTool}
          </button>
        </div>
      ) : (
        <div className="tools-grid">
          {filteredTools.map((tool) => {
            const isFree = !tool.price || tool.price === 0;
            const subscribed = hasActiveSubscription(tool);
            const activeSub = getActiveSubscription(tool);
            const isRecentlyAdded = recentlyAdded.includes(tool.id);

            return (
              <article 
                key={tool.id} 
                className={`tool-card ${isRecentlyAdded ? 'recently-added' : ''}`}
              >
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
                    <span className={`badge-status ${getToolTypeClass(tool)}`}>
                      {isFree ? copy.status.free : (subscribed ? copy.status.subscribed : copy.status.notSubscribed)}
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
              </article>
            );
          })}
        </div>
      )}

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