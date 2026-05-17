import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { formatEuro } from '../utils/formatCurrency';
import { getToolDescription } from '../utils/productDescriptions';
import './Subscriptions.css';

const FILTERS = ['all', 'active', 'inactive', 'archived'];

const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'ARCHIVED'];

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

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [manageModal, setManageModal] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const { t, i18n } = useTranslation();
  const isSpanish = i18n.language?.startsWith('es');

  const copy = isSpanish
    ? {
        title: 'Mis Suscripciones',
        subtitle: 'Gestiona todas tus suscripciones en un solo lugar',
        searchPlaceholder: 'Buscar suscripciones...',
        filters: {
          all: 'Todas',
          active: 'Activas',
          inactive: 'Inactivas',
          archived: 'Archivadas',
        },
        status: {
          active: 'Activa',
          inactive: 'Inactiva',
          archived: 'Archivada',
        },
        actions: {
          useTool: 'Usar',
          openTool: 'Abrir',
          manageSubscription: 'Gestionar',
          subscribe: 'Suscribirse',
        },
        subscription: {
          title: 'Gestionar Suscripcion',
          price: 'Precio',
          billingCycle: 'Ciclo',
          renewalDate: 'Renovacion',
          status: 'Estado',
          monthly: 'Mensual',
          yearly: 'Anual',
          active: 'Activa',
          archived: 'Archivada',
          inactive: 'Inactiva',
          save: 'Guardar',
          cancel: 'Cancelar',
          close: 'Cerrar',
          create: 'Crear',
        },
        noTools: 'No hay suscripciones en tu inventario',
        noResults: 'No se encontraron suscripciones',
        category: 'Categoria',
        uncategorized: 'Sin categoria',
        renewal: 'Renovacion',
        loadFailed: 'Error al cargar suscripciones',
      }
    : {
        title: 'My Subscriptions',
        subtitle: 'Manage all your subscriptions in one place',
        searchPlaceholder: 'Search subscriptions...',
        filters: {
          all: 'All',
          active: 'Active',
          inactive: 'Inactive',
          archived: 'Archived',
        },
        status: {
          active: 'Active',
          inactive: 'Inactive',
          archived: 'Archived',
        },
        actions: {
          useTool: 'Use',
          openTool: 'Open',
          manageSubscription: 'Manage',
          subscribe: 'Subscribe',
        },
        subscription: {
          title: 'Manage Subscription',
          price: 'Price',
          billingCycle: 'Billing',
          renewalDate: 'Renewal',
          status: 'Status',
          monthly: 'Monthly',
          yearly: 'Yearly',
          active: 'Active',
          archived: 'Archived',
          inactive: 'Inactive',
          save: 'Save',
          cancel: 'Cancel',
          close: 'Close',
          create: 'Create',
        },
        noTools: 'No subscriptions in your inventory',
        noResults: 'No subscriptions found',
        category: 'Category',
        uncategorized: 'Uncategorized',
        renewal: 'Renewal',
        loadFailed: 'Failed to load subscriptions',
      };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await api.get('/subscriptions');
      setSubscriptions(response.data);
    } catch (err) {
      setError(copy.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  const getBillingCycleLabel = (cycle) => {
    const key = cycle?.toLowerCase();
    if (key === 'monthly') return copy.subscription.monthly;
    if (key === 'yearly') return copy.subscription.yearly;
    return cycle || '';
  };

  const getToolStatusLabel = (status) => {
    const key = status?.toLowerCase();
    if (key === 'active') return copy.subscription.active;
    if (key === 'inactive') return copy.status.inactive;
    if (key === 'archived') return copy.status.archived;
    return status || '';
  };

  const getSubscriptionStatus = (subscription) => {
    const subscriptionStatus = subscription.status?.toLowerCase();
    if (['active', 'inactive', 'archived'].includes(subscriptionStatus)) {
      return subscriptionStatus;
    }

    const toolStatus = subscription.tool?.status?.toLowerCase();
    if (['active', 'inactive', 'archived'].includes(toolStatus)) {
      return toolStatus;
    }

    return 'inactive';
  };

  const uniqueSubscriptions = useMemo(() => {
    const seen = new Set();
    return subscriptions.filter((subscription) => {
      const key = [
        subscription.tool?.name?.trim().toLowerCase() || '',
        subscription.tool?.id || '',
        subscription.billingCycle?.trim().toLowerCase() || '',
        subscription.status?.trim().toLowerCase() || '',
        subscription.price?.toString() || '',
      ].join('|');

      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [subscriptions]);

  const filteredSubscriptions = useMemo(() => {
    let result = uniqueSubscriptions;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (sub) =>
          sub.tool?.name?.toLowerCase().includes(query) ||
          sub.tool?.type?.toLowerCase().includes(query) ||
          sub.tool?.category?.name?.toLowerCase().includes(query) ||
          sub.tool?.description?.toLowerCase().includes(query)
      );
    }

    result = result.filter((sub) => {
      const status = getSubscriptionStatus(sub);

      switch (activeFilter) {
        case 'active':
          return status === 'active';
        case 'inactive':
          return status === 'inactive';
        case 'archived':
          return status === 'archived';
        default:
          return true;
      }
    });

    return result;
  }, [uniqueSubscriptions, searchQuery, activeFilter]);

  const handleOpenTool = (tool) => {
    if (tool.url) {
      window.open(tool.url, '_blank');
    }
  };

  const openManageModal = (subscription) => {
    setManageModal(subscription);
    setSelectedStatus(subscription.status || 'ACTIVE');
  };

  const closeManageModal = () => {
    setManageModal(null);
    setSelectedStatus('');
  };

  const handleSaveStatus = async () => {
    if (!manageModal) return;
    setSaving(true);
    try {
      await api.put(`/subscriptions/${manageModal.id}`, {
        status: selectedStatus,
      });
      await fetchSubscriptions();
      closeManageModal();
    } catch (err) {
      console.error('Failed to update subscription status:', err);
    } finally {
      setSaving(false);
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

      {filteredSubscriptions.length === 0 ? (
        <div className="empty-state">{copy.noResults}</div>
      ) : (
        <div className="tools-grid">
          {filteredSubscriptions.map((subscription) => {
            const toolStatus = getSubscriptionStatus(subscription);
            const isFree = !subscription.tool?.price || subscription.tool?.price === 0;

            return (
              <article key={subscription.id} className={`tool-card status-${toolStatus}`}>
                <div className="tool-card-header">
                  <img
                    src={subscription.tool?.logoUrl || getFallbackLogo(subscription.tool?.name)}
                    alt={`${subscription.tool?.name || 'Subscription'} logo`}
                    className="tool-icon"
                    onError={(event) => {
                      event.currentTarget.src = getFallbackLogo(subscription.tool?.name);
                    }}
                  />
                  <div className="tool-badges">
                    <span className={`badge-status ${toolStatus}`}>
                      {getToolStatusLabel(subscription.tool?.status || subscription.status)}
                    </span>
                    {isFree && <span className="badge-free">FREE</span>}
                  </div>
                </div>

                <div className="tool-card-body">
                  <h3>{subscription.tool?.name || 'Subscription'}</h3>
                  <p className="tool-description">
                    {subscription.tool?.description || getToolDescription(subscription.tool) || subscription.tool?.type || '-'}
                  </p>
                  <p className="tool-category">
                    {copy.category}: {subscription.tool?.category?.name || copy.uncategorized}
                  </p>
                </div>

                <div className="tool-subscription-info">
                  <div className="sub-info-row">
                    <span className="sub-label">{copy.subscription.price}:</span>
                    <span className="sub-value">{formatEuro(subscription.price)}</span>
                  </div>
                  <div className="sub-info-row">
                    <span className="sub-label">{copy.subscription.billingCycle}:</span>
                    <span className="sub-value">
                      {getBillingCycleLabel(subscription.billingCycle)}
                    </span>
                  </div>
                  <div className="sub-info-row">
                    <span className="sub-label">{copy.renewal}:</span>
                    <span className="sub-value">
                      {new Date(subscription.renewalDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="tool-actions">
                  {subscription.tool?.url && (
                    <button
                      className="btn btn-primary"
                      onClick={() => handleOpenTool(subscription.tool)}
                    >
                      {copy.actions.openTool}
                    </button>
                  )}
                  <button className="btn btn-outline" onClick={() => openManageModal(subscription)}>
                    {copy.actions.manageSubscription}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {manageModal && (
        <div className="modal-overlay" onClick={closeManageModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{copy.subscription.title}</h2>
              <button className="modal-close" onClick={closeManageModal}>&times;</button>
            </div>

            <div className="modal-body">
              <div className="manage-sub-info">
                <strong>{manageModal.tool?.name}</strong>
                <span>{formatEuro(manageModal.price)} / {getBillingCycleLabel(manageModal.billingCycle)}</span>
              </div>

              <div className="form-group">
                <label>{copy.subscription.status}</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {copy.subscription[status.toLowerCase()]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button className="btn btn-outline" onClick={closeManageModal} disabled={saving}>
                  {copy.subscription.cancel}
                </button>
                <button className="btn btn-primary" onClick={handleSaveStatus} disabled={saving}>
                  {saving ? t('common.loading') : copy.subscription.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
