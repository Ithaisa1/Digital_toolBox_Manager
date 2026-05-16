/**
 * Tarjeta con cabecera, cuerpo y pie opcionales; admite clic si onClick está definido.
 */
import styles from './Card.module.css';

const Card = ({
  children,
  title,
  subtitle,
  footer,
  variant = 'default',
  className = '',
  onClick,
  ...props
}) => {
  const classes = [
    styles.card,
    styles[variant],
    onClick && styles.clickable,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={onClick} {...props}>
      {(title || subtitle) && (
        <div className={styles.cardHeader}>
          {title && <h3 className={styles.cardTitle}>{title}</h3>}
          {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
        </div>
      )}
      
      <div className={styles.cardBody}>
        {children}
      </div>
      
      {footer && (
        <div className={styles.cardFooter}>
          <div className={styles.cardActions}>
            {footer}
          </div>
        </div>
      )}
    </div>
  );
};

export default Card;
