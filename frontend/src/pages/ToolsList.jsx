import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { formatEuro } from '../utils/formatCurrency';
import { getToolDescription } from '../utils/productDescriptions';
import './ToolsList.css';

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
  const [subscriptionPanel, setSubscriptionPanel] = useState(null);
  const [subscriptionForm, setSubscriptionForm] = useState({
    price: '',
    billingCycle: 'monthly',
    renewalDate: '',
    plan: '',
  });
  const { t, i18n } = useTranslation();
  const isSpanish = i18n.language?.startsWith('es');

  const copy = isSpanish
    ? {
        title: 'Herramientas',
        subtitle: 'Descubre y gestiona todas tus herramientas digitales',
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
          plan: 'Plan',
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
        category: 'Categoria',
        uncategorized: 'Sin categoria',
        renewal: 'Renovacion',
        loadFailed: 'Error al cargar herramientas',
      }
    : {
        title: 'Tools',
        subtitle: 'Discover and manage all your digital tools',
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
          plan: 'Plan',
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

  const uniqueTools = useMemo(() => {
    const seen = new Set();
    return tools.filter((tool) => {
      const key = tool?.name?.trim().toLowerCase() || '';
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [tools]);

  // FILTRAR: Solo herramientas sin suscripción activa
  const filteredTools = useMemo(() => {
    return uniqueTools.filter((tool) => {
      const hasActiveSubscription = tool.subscriptions?.some(
        (sub) => sub.status === 'ACTIVE'
      );
      return !hasActiveSubscription; // Solo mostrar si NO tiene suscripción activa
    });
  }, [uniqueTools]);

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

      {filteredTools.length === 0 ? (
        <div className="empty-state">{copy.noResults}</div>
      ) : (
        <div className="tools-grid">
          {filteredTools.map((tool) => {
            const status = getToolStatus(tool);
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
              </div>
            </div>

            <div className="panel-form">
              <div className="form-group">
                <label>{copy.subscription.plan}</label>
                <input
                  type="text"
                  placeholder="e.g., Personal, Business, Enterprise"
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