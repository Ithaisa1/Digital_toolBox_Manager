import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { formatEuro } from '../utils/formatCurrency';
import { getToolDescription } from '../utils/productDescriptions';
import './Subscriptions.css';

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
  const { t, i18n } = useTranslation();
  const isSpanish = i18n.language?.startsWith('es');
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const copy = isSpanish
    ? {
        subtitle: 'Consulta todas las suscripciones de tu cuenta en un solo lugar.',
        empty: 'Todavia no tienes suscripciones registradas.',
        manage: 'Gestionar',
        active: 'Activa',
        inactive: 'Inactiva',
        archived: 'Archivada',
        category: 'Categoria',
        descriptionFallback: 'Sin descripcion',
        uncategorized: 'Sin categoria',
        loadFailed: 'Error al cargar suscripciones',
      }
    : {
        subtitle: 'See all subscriptions for your account in one place.',
        empty: 'You do not have any subscriptions yet.',
        manage: 'Manage',
        active: 'Active',
        inactive: 'Inactive',
        archived: 'Archived',
        category: 'Category',
        descriptionFallback: 'No description available',
        uncategorized: 'Uncategorized',
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
    if (key === 'monthly') return isSpanish ? 'Mensual' : 'Monthly';
    if (key === 'yearly') return isSpanish ? 'Anual' : 'Yearly';
    return cycle || '';
  };

  const getToolStatusLabel = (status) => {
    const key = status?.toLowerCase();
    if (key === 'active') return copy.active;
    if (key === 'inactive') return copy.inactive;
    if (key === 'archived') return copy.archived;
    return status || '';
  };

  const uniqueSubscriptions = useMemo(() => {
    const seen = new Set();
    return subscriptions.filter((subscription) => {
      const key = [
        subscription.tool?.name?.trim().toLowerCase() || '',
        subscription.billingCycle?.trim().toLowerCase() || '',
        subscription.status?.trim().toLowerCase() || '',
        subscription.price?.toString() || '',
      ].join('|');

      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [subscriptions]);

  if (loading) return <div className="loading">{t('common.loading')}</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="subscriptions-page">
      <div className="subscriptions-header">
        <div className="subscriptions-heading">
          <h1>{t('subscriptions.title')}</h1>
          <p>{copy.subtitle}</p>
        </div>
      </div>

      {uniqueSubscriptions.length === 0 ? (
        <div className="subscriptions-empty card">
          <p>{copy.empty}</p>
        </div>
      ) : (
        <div className="subscriptions-grid">
          {uniqueSubscriptions.map((subscription) => (
            <article key={subscription.id} className="subscription-card card">
              <div className="subscription-card-top">
                <div className="subscription-brand">
                  <img
                    src={subscription.tool?.logoUrl || getFallbackLogo(subscription.tool?.name)}
                    alt={`${subscription.tool?.name || subscription.tool?.type || 'Subscription'} logo`}
                    className="subscription-logo"
                    onError={(event) => {
                      event.currentTarget.src = getFallbackLogo(subscription.tool?.name);
                    }}
                  />
                  <div className="subscription-brand-text">
                    <h3>{subscription.tool?.name || t('subscriptions.title')}</h3>
                    <p>
                      {subscription.tool?.description
                        || getToolDescription(subscription.tool)
                        || subscription.tool?.type
                        || copy.descriptionFallback}
                    </p>
                  </div>
                </div>
                <div className="subscription-card-actions">
                  <span className={`subscription-status ${subscription.tool?.status?.toLowerCase()}`}>
                    {getToolStatusLabel(subscription.tool?.status)}
                  </span>
                  {subscription.toolId && (
                    <Link to={`/tools/${subscription.toolId}`} className="btn btn-secondary">
                      {copy.manage}
                    </Link>
                  )}
                </div>
              </div>

              <div className="subscription-meta">
                <div>
                  <span className="meta-label">{t('subscriptions.price')}</span>
                  <span className="meta-value">{formatEuro(subscription.price)}</span>
                </div>
                <div>
                  <span className="meta-label">{t('subscriptions.billingCycle')}</span>
                  <span className="meta-value">{getBillingCycleLabel(subscription.billingCycle)}</span>
                </div>
                <div>
                  <span className="meta-label">{t('subscriptions.renewalDate')}</span>
                  <span className="meta-value">{new Date(subscription.renewalDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="meta-label">{copy.category}</span>
                  <span className="meta-value">{subscription.tool?.category?.name || copy.uncategorized}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
