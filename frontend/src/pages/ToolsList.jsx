import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { formatEuro } from '../utils/formatCurrency';
import { getToolDescription } from '../utils/productDescriptions';
import './ToolsList.css';

const FILTERS = ['all', 'free', 'subscribed', 'available', 'premium'];

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

const ToolsList = () => {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [subscriptionPanel, setSubscriptionPanel] = useState(null);
  const [subscriptionForm, setSubscriptionForm] = useState({
    price: '',
    billingCycle: 'monthly',
    renewalDate: '',
  });
  const { t, i18n } = useTranslation();
  const isSpanish = i18n.language?.startsWith('es');

  const copy = isSpanish
    ? {
        title: 'Mi Inventario',
        subtitle: 'Gestiona todas tus herramientas digitales en un solo lugar',
        searchPlaceholder: 'Buscar herramientas...',
        filters: {
          all: 'Todas',
          free: 'Gratis',
          subscribed: 'Suscritas',
          available: 'Disponibles',
          premium: 'Premium',
        },
        status: {
          free: 'Gratis',
          subscribed: 'Suscrito',
          notSubscribed: 'Suscribirse',
          premium: 'Premium',
        },
        actions: {
          useTool: 'Usar herramienta',
          openTool: 'Abrir herramienta',
          manageSubscription: 'Gestionar',
          subscribe: 'Suscribirse',
        },
        subscription: {
          title: 'Gestionar Suscripcion',
          price: 'Precio',
          billingCycle: 'Ciclo de facturacion',
          renewalDate: 'Fecha de renovacion',
          status: 'Estado',
          monthly: 'Mensual',
          yearly: 'Anual',
          active: 'Activa',
          cancelled: 'Cancelada',
          expired: 'Expirada',
          save: 'Guardar cambios',
          cancel: 'Cancelar suscripcion',
          close: 'Cerrar',
          create: 'Crear suscripcion',
          confirmCancel: 'Estas seguro de cancelar esta suscripcion?',
        },
        noTools: 'No hay herramientas en tu inventario',
        noResults: 'No se encontraron herramientas',
        addTool: '+ Anadir herramienta',
        category: 'Categoria',
        uncategorized: 'Sin categoria',
        renewal: 'Renovacion',
        loadFailed: 'Error al cargar herramientas',
      }
    : {
        title: 'My Inventory',
        subtitle: 'Manage all your digital tools in one place',
        searchPlaceholder: 'Search tools...',
        filters: {
          all: 'All',
          free: 'Free',
          subscribed: 'Subscribed',
          available: 'Available',
          premium: 'Premium',
        },
        status: {
          free: 'Free',
          subscribed: 'Subscribed',
          notSubscribed: 'Subscribe',
          premium: 'Premium',
        },
        actions: {
          useTool: 'Use tool',
          openTool: 'Open tool',
          manageSubscription: 'Manage',
          subscribe: 'Subscribe',
        },
        subscription: {
          title: 'Manage Subscription',
          price: 'Price',
          billingCycle: 'Billing cycle',
          renewalDate: 'Renewal date',
          status: 'Status',
          monthly: 'Monthly',
          yearly: 'Yearly',
          active: 'Active',
          cancelled: 'Cancelled',
          expired: 'Expired',
          save: 'Save changes',
          cancel: 'Cancel subscription',
          close: 'Close',
          create: 'Create subscription',
          confirmCancel: 'Are you sure you want to cancel this subscription?',
        },
        noTools: 'No tools in your inventory',
        noResults: 'No tools found',
        addTool: '+ Add tool',
        category: 'Category',
        uncategorized: 'Uncategorized',
        renewal: 'Renewal',
        loadFailed: 'Failed to load tools',
      };

  useEffect(() => {
    fetchTools();
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

  const getToolStatus = (tool) => {
    const hasActiveSubscription = tool.subscriptions?.some(
      (sub) => sub.status === 'ACTIVE'
    );
    const isFree = !tool.price || tool.price === 0;

    if (isFree) return 'free';
    if (hasActiveSubscription) return 'subscribed';
    return 'notSubscribed';
  };

  const getActiveSubscription = (tool) => {
    return tool.subscriptions?.find((sub) => sub.status === 'ACTIVE') || null;
  };

  const filteredTools = useMemo(() => {
    let result = tools;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (tool) =>
          tool.name?.toLowerCase().includes(query) ||
          tool.type?.toLowerCase().includes(query) ||
          tool.category?.name?.toLowerCase().includes(query)
      );
    }

    result = result.filter((tool) => {
      const status = getToolStatus(tool);
      const isFree = !tool.price || tool.price === 0;
      const hasActiveSubscription = tool.subscriptions?.some(
        (sub) => sub.status === 'ACTIVE'
      );

      switch (activeFilter) {
        case 'free':
          return isFree;
        case 'subscribed':
          return hasActiveSubscription;
        case 'available':
          return !isFree && !hasActiveSubscription;
        case 'premium':
          return !isFree;
        default:
          return true;
      }
    });

    return result;
  }, [tools, searchQuery, activeFilter]);

  const handleOpenSubscriptionPanel = (tool, existingSub = null) => {
    if (existingSub) {
      setSubscriptionForm({
        price: existingSub.price.toString(),
        billingCycle: existingSub.billingCycle,
        renewalDate: existingSub.renewalDate?.split('T')[0] || '',
      });
    } else {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setSubscriptionForm({
        price: tool.price?.toString() || '',
        billingCycle: 'monthly',
        renewalDate: nextMonth.toISOString().split('T')[0],
      });
    }
    setSubscriptionPanel({ tool, existingSub });
  };

  const handleCloseSubscriptionPanel = () => {
    setSubscriptionPanel(null);
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
      handleCloseSubscriptionPanel();
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
        handleCloseSubscriptionPanel();
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
          {FILTERS.map((filter) => (
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

      {filteredTools.length === 0 ? (
        <div className="empty-state">{copy.noResults}</div>
      ) : (
        <div className="tools-grid">
          {filteredTools.map((tool) => {
            const status = getToolStatus(tool);
            const activeSub = getActiveSubscription(tool);
            const isFree = !tool.price || tool.price === 0;

            return (
              <article key={tool.id} className={`tool-card status-${status}`}>
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
                    <span className={`badge-status ${status}`}>
                      {copy.status[status]}
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
                      <span className="sub-label">{copy.renewal}:</span>
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
                  {status === 'free' && (
                    <button
                      className="btn btn-primary"
                      onClick={() => handleOpenTool(tool)}
                    >
                      {copy.actions.useTool}
                    </button>
                  )}

                  {status === 'subscribed' && (
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
                        {copy.actions.manageSubscription}
                      </button>
                    </>
                  )}

                  {status === 'notSubscribed' && (
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

      {subscriptionPanel && (
        <div className="subscription-panel-overlay" onClick={handleCloseSubscriptionPanel}>
          <div className="subscription-panel" onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
              <h2>{copy.subscription.title}</h2>
              <button className="panel-close" onClick={handleCloseSubscriptionPanel}>
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
                {subscriptionPanel.existingSub && (
                  <span className={`badge-status ${subscriptionPanel.existingSub.status.toLowerCase()}`}>
                    {subscriptionPanel.existingSub.status === 'ACTIVE'
                      ? copy.subscription.active
                      : subscriptionPanel.existingSub.status === 'CANCELLED'
                        ? copy.subscription.cancelled
                        : copy.subscription.expired}
                  </span>
                )}
              </div>
            </div>

            <div className="panel-form">
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

              <button className="btn btn-outline" onClick={handleCloseSubscriptionPanel}>
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