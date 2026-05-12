import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
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

  useEffect(() => {
    fetchTools();
    fetchCategories();
  }, []);

  const fetchTools = async () => {
    try {
      const response = await api.get('/tools');
      setTools(response.data);
    } catch (err) {
      setError('Failed to load tools');
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
      setError('Failed to create tool');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tool?')) return;
    
    try {
      await api.delete(`/tools/${id}`);
      fetchTools();
    } catch (err) {
      setError('Failed to delete tool');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="tools-container">
      <div className="tools-header">
        <h1>My Tools</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Tool'}
        </button>
      </div>

      {showForm && (
        <div className="tool-form card">
          <h2>Create New Tool</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Type:</label>
              <input
                type="text"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>URL:</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Price:</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Status:</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div className="form-group">
              <label>Category:</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary">Create Tool</button>
          </form>
        </div>
      )}

      {tools.length === 0 ? (
        <div className="empty-state">
          <p>No tools yet. Start by adding your first tool!</p>
        </div>
      ) : (
        <div className="tools-grid">
          {tools.map((tool) => (
            <div key={tool.id} className="tool-card">
              <div className="tool-header">
                <h3>{tool.name}</h3>
                <span className={`badge ${tool.status.toLowerCase()}`}>{tool.status}</span>
              </div>
              <p className="tool-type">{tool.type}</p>
              {tool.price && <p className="tool-price">${tool.price.toFixed(2)}/mo</p>}
              {tool.category && <p className="tool-category">{tool.category.name}</p>}
              {tool.url && (
                <a href={tool.url} target="_blank" rel="noopener noreferrer" className="tool-link">
                  Visit Website
                </a>
              )}
              <div className="tool-actions">
                <Link to={`/tools/${tool.id}`} className="btn btn-secondary">View Details</Link>
                <button 
                  onClick={() => handleDelete(tool.id)} 
                  className="btn btn-danger"
                >
                  Delete
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
