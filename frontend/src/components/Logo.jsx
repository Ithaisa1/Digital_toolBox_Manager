/**
 * Logo de Dexa: una "D" geométrica sobre el degradado aurora.
 * Dibujado con trazados (no depende de ninguna fuente).
 */
import { useId } from 'react';

export const LogoMark = ({ size = 32, className = '' }) => {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="0.5" stopColor="#6366f1" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
        <radialGradient id={`h${id}`} cx="0.25" cy="0.15" r="0.8">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="0.6" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="512" height="512" rx="128" fill={`url(#g${id})`} />
      <rect width="512" height="512" rx="128" fill={`url(#h${id})`} />
      <path
        fillRule="evenodd"
        fill="#ffffff"
        d="M152 128h112c70.7 0 128 57.3 128 128s-57.3 128-128 128H152V128zm64 64v128h48c35.3 0 64-28.7 64-64s-28.7-64-64-64h-48z"
      />
      <circle cx="392" cy="128" r="28" fill="#f9a8d4" />
    </svg>
  );
};

const Logo = ({ size = 32, showText = true }) => (
  <span className="logo">
    <LogoMark size={size} />
    {showText && (
      <span className="logo-text">
        dexa<span className="logo-text-muted">manager</span>
      </span>
    )}
  </span>
);

export default Logo;
