import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home-container">
      <div className="hero">
        <h1>Digital Toolbox Manager</h1>
        <p>Manage your digital tools efficiently</p>
        <div className="hero-actions">
          {!user ? (
            <>
              <Link to="/login" className="btn btn-primary">Iniciar sesión</Link>
              <Link to="/register" className="btn btn-secondary">Registrarse</Link>
            </>
          ) : (
            <Link to="/dashboard" className="btn btn-primary">Dashboard</Link>
          )}
        </div>
      </div>
      <div className="features">
        <div className="feature-card">
          <h3>Tool Management</h3>
          <p>Organize and track all your digital tools in one place</p>
        </div>
        <div className="feature-card">
          <h3>Subscription Tracking</h3>
          <p>Monitor your tool subscriptions and renewal dates</p>
        </div>
        <div className="feature-card">
          <h3>Categories</h3>
          <p>Group your tools by categories for better organization</p>
        </div>
        <div className="feature-card">
          <h3>Activity Log</h3>
          <p>Track all changes and movements in your toolbox</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
