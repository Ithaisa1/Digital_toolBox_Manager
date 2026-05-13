import { useTranslation } from 'react-i18next';
import './ThemeToggle.css';

const ThemeToggle = ({ className = '', theme = 'dark', onToggle }) => {
  const { t } = useTranslation();
  const isLight = theme === 'light';
  const label = isLight ? t('profile.darkTheme') : t('profile.lightTheme');
  const icon = isLight
    ? String.fromCodePoint(0x1F319)
    : String.fromCodePoint(0x2600);

  return (
    <button
      className={`theme-toggle ${className}`.trim()}
      onClick={onToggle}
      type="button"
      aria-pressed={isLight}
      title={label}
      aria-label={label}
    >
      <span className="theme-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="theme-label">{label}</span>
    </button>
  );
};

export default ThemeToggle;
