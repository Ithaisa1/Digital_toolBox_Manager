import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './ThemeToggle.css';

const ThemeToggle = ({ className = '' }) => {
  const { t } = useTranslation();
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.body.className = savedTheme;
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.body.className = newTheme;
  };

  return (
    <button 
      className={`theme-toggle ${className}`}
      onClick={toggleTheme}
      title={t('profile.toggleTheme')}
    >
      {theme === 'light' ? (
        <span className="theme-icon">🌙</span>
      ) : (
        <span className="theme-icon">☀️</span>
      )}
    </button>
  );
};

export default ThemeToggle;
