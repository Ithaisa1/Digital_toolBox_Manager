import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import './ToolDetail.css';

const ToolDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tool, setTool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState({
    renewalDate: '',
    price: '',
    billingCycle: 'monthly',
    status: 'ACTIVE',
  });
  const [showEditForm, setShowEditForm] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    type: '',
    url: '',
    price: '',
    status: 'ACTIVE',
    categoryId: '',
  });
  const [categories, setCategories] = useState([]);
  const { t } = useTranslation();

  useEffect(() => {
    fetchTool();
    fetchCategories();
  }, [id]);

  const fetchTool = async () => {
    try {
      const response = await api.get(`/tools/${id}`);
      setTool(response.data);
      setEditData({
        name: response.data.name,
        type: response.data.type,
        url: response.data.url || '',
        price: response.data.price || '',
        status: response.data.status,
        categoryId: response.data.categoryId || '',
      });
    } catch (err) {
      setError(t('toolDetail.toolNotFound'));
      if (err.response?.status === 404) {
        setError(t('toolDetail.toolNotFound'));
      }
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

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/tools/${id}`, {
        ...editData,
        price: editData.price ? parseFloat(editData.price) : null,
      });
      setShowEditForm(false);
      fetchTool();
    } catch (err) {
      setError(t('tools.updateFailed'));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('tools.deleteConfirm'))) return;
    
    try {
      await api.delete(`/tools/${id}`);
      navigate('/tools');
    } catch (err) {
      setError(t('tools.deleteFailed'));
    }
  };

  const handleCreateSubscription = async (e) => {
    e.preventDefault();
    try {
      await api.post('/subscriptions', {
        toolId: id,
        renewalDate: subscriptionData.renewalDate,
        price: parseFloat(subscriptionData.price),
        billingCycle: subscriptionData.billingCycle,
        status: subscriptionData.status,
      });
      setShowSubscriptionForm(false);
      setSubscriptionData({
        renewalDate: '',
        price: '',
        billingCycle: 'monthly',
        status: 'ACTIVE',
      });
      fetchTool();
    } catch (err) {
      setError(t('toolDetail.createSubscriptionFailed'));
    }
  };

  const handleDeleteSubscription = async (subId) => {
    if (!window.confirm(t('toolDetail.deleteSubscriptionConfirm'))) return;
    
    try {
      await api.delete(`/subscriptions/${subId}`);
      fetchTool();
    } catch (err) {
      setError(t('toolDetail.deleteSubscriptionFailed'));
    }
  };

  if (loading) return <div className="loading">{t('common.loading')}</div>;
  if (error) return <div className="error">{error}</div>;
  if (!tool) return <div className="error">{t('toolDetail.toolNotFound')}</div>;

  return (
    <div className="tool-detail-container">
      <div className="back-link">
        <Link to="/tools">← {t('common.back')}</Link>
      </div>

      <div className="tool-detail-header">
        <h1>{tool.name}</h1>
        <span className={`badge ${tool.status.toLowerCase()}`}>{t(`tools.${tool.status.toLowerCase()}`)}</span>
      </div>

      <div className="tool-detail-content">
        <div className="tool-info card">
          <h2>{t('toolDetail.toolInformation')}</h2>
          <div className="info-row">
            <span className="label">{t('toolDetail.type')}:</span>
            <span className="value">{tool.type}</span>
          </div>
          <div className="info-row">
            <span className="label">{t('toolDetail.price')}:</span>
            <span className="value">{tool.price ? `$${tool.price.toFixed(2)}/mo` : t('toolDetail.free')}</span>
          </div>
          {tool.url && (
            <div className="info-row">
              <span className="label">URL:</span>
              <a href={tool.url} target="_blank" rel="noopener noreferrer" className="value link">
                {tool.url}
              </a>
            </div>
          )}
          {tool.category && (
            <div className="info-row">
              <span className="label">{t('tools.category')}:</span>
              <span className="value">{tool.category.name}</span>
            </div>
          )}
          <div className="info-row">
            <span className="label">{t('toolDetail.created')}:</span>
            <span className="value">{new Date(tool.createdAt).toLocaleDateString()}</span>
          </div>

          <div className="tool-actions">
            <button onClick={() => setShowEditForm(!showEditForm)} className="btn btn-secondary">
              {showEditForm ? t('common.cancel') : t('common.edit')}
            </button>
            <button onClick={handleDelete} className="btn btn-danger">{t('common.delete')}</button>
          </div>

          {showEditForm && (
            <form onSubmit={handleUpdate} className="edit-form">
              <div className="form-group">
                <label>{t('tools.name')}:</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t('tools.type')}:</label>
                <input
                  type="text"
                  value={editData.type}
                  onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>URL:</label>
                <input
                  type="url"
                  value={editData.url}
                  onChange={(e) => setEditData({ ...editData, url: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>{t('toolDetail.price')}:</label>
                <input
                  type="number"
                  step="0.01"
                  value={editData.price}
                  onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>{t('tools.status')}:</label>
                <select
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                >
                  <option value="ACTIVE">{t('tools.active')}</option>
                  <option value="INACTIVE">{t('tools.inactive')}</option>
                  <option value="ARCHIVED">{t('tools.archived')}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{t('tools.category')}:</label>
                <select
                  value={editData.categoryId}
                  onChange={(e) => setEditData({ ...editData, categoryId: e.target.value })}
                >
                  <option value="">{t('tools.selectCategory')}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary">{t('tools.updateTool')}</button>
            </form>
          )}
        </div>

        <div className="subscriptions card">
          <div className="section-header">
            <h2>{t('toolDetail.subscriptions')}</h2>
            <button onClick={() => setShowSubscriptionForm(!showSubscriptionForm)} className="btn btn-primary">
              {showSubscriptionForm ? t('common.cancel') : t('toolDetail.addSubscription')}
            </button>
          </div>

          {showSubscriptionForm && (
            <form onSubmit={handleCreateSubscription} className="subscription-form">
              <div className="form-group">
                <label>{t('toolDetail.renewalDate')}:</label>
                <input
                  type="date"
                  value={subscriptionData.renewalDate}
                  onChange={(e) => setSubscriptionData({ ...subscriptionData, renewalDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t('toolDetail.price')}:</label>
                <input
                  type="number"
                  step="0.01"
                  value={subscriptionData.price}
                  onChange={(e) => setSubscriptionData({ ...subscriptionData, price: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t('toolDetail.billingCycle')}:</label>
                <select
                  value={subscriptionData.billingCycle}
                  onChange={(e) => setSubscriptionData({ ...subscriptionData, billingCycle: e.target.value })}
                >
                  <option value="monthly">{t('toolDetail.monthly')}</option>
                  <option value="yearly">{t('toolDetail.yearly')}</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary">{t('toolDetail.addSubscription')}</button>
            </form>
          )}

          {tool.subscriptions.length === 0 ? (
            <p className="empty-state">{t('toolDetail.noSubscriptions')}</p>
          ) : (
            <div className="subscriptions-list">
              {tool.subscriptions.map((sub) => (
                <div key={sub.id} className="subscription-item">
                  <div className="subscription-info">
                    <p className="subscription-price">${sub.price.toFixed(2)}/{sub.billingCycle}</p>
                    <p className="subscription-renewal">{t('toolDetail.renews')}: {new Date(sub.renewalDate).toLocaleDateString()}</p>
                    <span className={`badge ${sub.status.toLowerCase()}`}>{sub.status}</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteSubscription(sub.id)} 
                    className="btn btn-danger"
                  >
                    {t('common.delete')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="movements card">
          <h2>{t('toolDetail.recentActivity')}</h2>
          {tool.movements.length === 0 ? (
            <p className="empty-state">{t('toolDetail.noActivity')}</p>
          ) : (
            <div className="movements-list">
              {tool.movements.map((movement) => (
                <div key={movement.id} className="movement-item">
                  <span className="movement-type">{movement.type}</span>
                  <span className="movement-description">{movement.description}</span>
                  <span className="movement-date">{new Date(movement.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToolDetail;
