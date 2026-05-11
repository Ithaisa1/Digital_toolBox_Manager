import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import './ToolsList.css';

const ToolsList = () => {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
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
    fetchTools();
    fetchCategories();
  }, []);

  const fetchTools = async () => {
    try {
      const response = await api.get('/tools');
      setTools(response.data);
    } catch (err) {
      setError(t('tools.createFailed'));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tools', {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null,
      });
      setShowForm(false);
      setFormData({
        name: '',
        type: '',
        url: '',
        price: '',
        status: 'ACTIVE',
        categoryId: '',
      });
      fetchTools();
    } catch (err) {
      setError(t('tools.createFailed'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('tools.deleteConfirm'))) return;
    
    try {
      await api.delete(`/tools/${id}`);
      fetchTools();
    } catch (err) {
      setError(t('tools.deleteFailed'));
    }
  };

  if (loading) return <div className="loading">{t('common.loading')}</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="tools-container">
      <div className="tools-header">
        <h1>{t('tools.title')}</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? t('common.cancel') : t('tools.addTool')}
        </button>
      </div>

      {showForm && (
        <div className="tool-form card">
          <h2>{t('tools.createTool')}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t('tools.name')}:</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>{t('tools.type')}:</label>
              <input
                type="text"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>{t('tools.url')}:</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>{t('tools.price')}:</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>{t('tools.status')}:</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ACTIVE">{t('tools.active')}</option>
                <option value="INACTIVE">{t('tools.inactive')}</option>
                <option value="ARCHIVED">{t('tools.archived')}</option>
              </select>
            </div>
            <div className="form-group">
              <label>{t('tools.category')}:</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              >
                <option value="">{t('tools.selectCategory')}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary">{t('tools.createTool')}</button>
          </form>
        </div>
      )}

      {tools.length === 0 ? (
        <div className="empty-state">
          <p>{t('tools.noTools')}</p>
        </div>
      ) : (
        <div className="tools-grid">
          {tools.map((tool) => (
            <div key={tool.id} className="tool-card">
              <div className="tool-header">
                <h3>{tool.name}</h3>
                <span className={`badge ${tool.status.toLowerCase()}`}>{t(`tools.${tool.status.toLowerCase()}`)}</span>
              </div>
              <p className="tool-type">{tool.type}</p>
              {tool.price && <p className="tool-price">${tool.price.toFixed(2)}/mo</p>}
              {tool.category && <p className="tool-category">{tool.category.name}</p>}
              {tool.url && (
                <a href={tool.url} target="_blank" rel="noopener noreferrer" className="tool-link">
                  {t('tools.visitWebsite')}
                </a>
              )}
              <div className="tool-actions">
                <Link to={`/tools/${tool.id}`} className="btn btn-secondary">{t('tools.viewDetails')}</Link>
                <button 
                  onClick={() => handleDelete(tool.id)} 
                  className="btn btn-danger"
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ToolsList;
