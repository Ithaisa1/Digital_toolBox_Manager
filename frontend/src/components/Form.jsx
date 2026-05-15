import styles from './Form.module.css';

const Form = ({ 
  children, 
  onSubmit, 
  className = '', 
  variant = 'default',
  ...props 
}) => {
  const classes = [styles.form, styles[variant], className].filter(Boolean).join(' ');

  return (
    <form className={classes} onSubmit={onSubmit} {...props}>
      {children}
    </form>
  );
};

export const FormGroup = ({ children, className = '', ...props }) => {
  return (
    <div className={`${styles.formGroup} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const FormLabel = ({ 
  children, 
  required = false, 
  className = '', 
  ...props 
}) => {
  const classes = [
    styles.formLabel,
    required && styles.required,
    className
  ].filter(Boolean).join(' ');

  return (
    <label className={classes} {...props}>
      {children}
    </label>
  );
};

export const FormInput = ({ 
  type = 'text', 
  error, 
  help, 
  className = '', 
  ...props 
}) => {
  const classes = [
    styles.formInput,
    styles[`form${type.charAt(0).toUpperCase() + type.slice(1)}`],
    error && styles.error,
    className
  ].filter(Boolean).join(' ');

  return (
    <>
      <input
        type={type}
        className={classes}
        {...props}
      />
      {error && <div className={styles.formError}>{error}</div>}
      {help && <div className={styles.formHelp}>{help}</div>}
    </>
  );
};

export const FormTextarea = ({ error, help, className = '', ...props }) => {
  const classes = [
    styles.formInput,
    styles.formTextarea,
    error && styles.error,
    className
  ].filter(Boolean).join(' ');

  return (
    <>
      <textarea className={classes} {...props} />
      {error && <div className={styles.formError}>{error}</div>}
      {help && <div className={styles.formHelp}>{help}</div>}
    </>
  );
};

export const FormSelect = ({ children, error, help, className = '', ...props }) => {
  const classes = [
    styles.formInput,
    styles.formSelect,
    error && styles.error,
    className
  ].filter(Boolean).join(' ');

  return (
    <>
      <select className={classes} {...props}>
        {children}
      </select>
      {error && <div className={styles.formError}>{error}</div>}
      {help && <div className={styles.formHelp}>{help}</div>}
    </>
  );
};

export const FormCheckbox = ({ 
  label, 
  error, 
  help, 
  className = '', 
  ...props 
}) => {
  return (
    <div className={`${styles.checkboxGroup} ${className}`}>
      <input
        type="checkbox"
        className={styles.formCheckbox}
        {...props}
      />
      {label && <label>{label}</label>}
      {error && <div className={styles.formError}>{error}</div>}
      {help && <div className={styles.formHelp}>{help}</div>}
    </div>
  );
};

export const FormActions = ({ 
  children, 
  align = 'end', 
  stacked = false, 
  className = '', 
  ...props 
}) => {
  const classes = [
    styles.formActions,
    styles[align],
    stacked && styles.stacked,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Form;
