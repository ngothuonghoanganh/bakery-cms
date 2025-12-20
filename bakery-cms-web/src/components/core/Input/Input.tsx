/**
 * Input component
 * Atomic UI component for user text input
 */

import type { InputProps } from './Input.types';
import './Input.styles.css';

export const Input = ({
  type = 'text',
  size = 'md',
  value,
  onChange,
  placeholder,
  disabled = false,
  error,
  label,
  name,
  required = false,
  className = '',
  fullWidth = false,
}: InputProps): React.JSX.Element => {
  const inputClassNames = [
    'input',
    `input-${size}`,
    error ? 'input-error' : '',
    fullWidth ? 'input-full-width' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const wrapperClassNames = ['input-wrapper', fullWidth ? 'input-wrapper-full-width' : '']
    .filter(Boolean)
    .join(' ');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onChange(e.target.value);
  };

  return (
    <div className={wrapperClassNames}>
      {label && (
        <label htmlFor={name} className={`input-label ${required ? 'input-label-required' : ''}`}>
          {label}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        className={inputClassNames}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
      />
      {error && <span className="input-error-message">{error}</span>}
    </div>
  );
};
