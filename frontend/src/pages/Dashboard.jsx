import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!stats) return <div className="error">No data available</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>Dashboard</h1>
            <p>Overview of your digital toolbox</p>
          </div>
        </div>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Tools</h3>
          <p className="stat-number">{stats.tools.total}</p>
          <p className="stat-detail">
            Active: {stats.tools.byStatus.ACTIVE || 0} | 
            Inactive: {stats.tools.byStatus.INACTIVE || 0}
          </p>
        </div>
        
        <div className="stat-card">
          <h3>Subscriptions</h3>
          <p className="stat-number">{stats.subscriptions.total}</p>
          <p className="stat-detail">
            Monthly Cost: ${stats.subscriptions.monthlyCost.toFixed(2)}
          </p>
        </div>
        
        <div className="stat-card">
          <h3>Upcoming Renewals</h3>
          <p className="stat-number">{stats.subscriptions.upcomingRenewals}</p>
          <p className="stat-detail">Next 30 days</p>
        </div>
        
        <div className="stat-card">
          <h3>Categories</h3>
          <p className="stat-number">{stats.categories}</p>
          <p className="stat-detail">Tool categories</p>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Most Expensive Tools</h2>
        {stats.expensiveTools.length > 0 ? (
          <div className="tools-list">
            {stats.expensiveTools.map((tool) => (
              <div key={tool.id} className="tool-item">
                <h4>{tool.name}</h4>
                <p className="tool-price">${tool.price.toFixed(2)}/mo</p>
                <p className="tool-category">{tool.category?.name || 'Uncategorized'}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">No pricing information available</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
