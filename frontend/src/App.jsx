/**
 * Componente raíz: enrutamiento, tema claro/oscuro y layout principal.
 * Con persistencia de ruta actual al recargar.
 */
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ToolsList from './pages/ToolsList';
import Subscriptions from './pages/Subscriptions';
import ToolDetail from './pages/ToolDetail';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import Spinner from './components/Spinner';
import './App.css';

function AppContent() {
  // Tema persistido en localStorage
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [initialPath, setInitialPath] = useState(null);
  const { user, loading } = useAuth();
  const location = useLocation();

  // Sincroniza clases del body y guarda la preferencia
  useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark');
    document.body.classList.toggle('light', theme !== 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Guarda la ruta actual cuando el usuario está autenticado
  useEffect(() => {
    if (user && location.pathname !== '/') {
      localStorage.setItem('lastRoute', location.pathname);
    }
  }, [location.pathname, user]);

  // Restaura la ruta guardada cuando carga la app
  useEffect(() => {
    if (!loading && !initialPath) {
      const savedRoute = localStorage.getItem('lastRoute');
      if (savedRoute && user) {
        setInitialPath(savedRoute);
      }
    }
  }, [loading, user, initialPath]);

  const toggleTheme = () => {
    // Alterna entre tema claro y oscuro
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="App">
      <Navbar theme={theme} onToggleTheme={toggleTheme} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/tools" element={
            <ProtectedRoute>
              <ToolsList />
            </ProtectedRoute>
          } />
          <Route path="/subscriptions" element={
            <ProtectedRoute>
              <Subscriptions />
            </ProtectedRoute>
          } />
          <Route path="/tools/:id" element={
            <ProtectedRoute>
              <ToolDetail />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;