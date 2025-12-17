/**
 * Button component
 * Atomic UI component for user interactions
 */

import type { ButtonProps } from './Button.types';
import './Button.styles.css';

export const Button = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  onClick,
  children,
  className = '',
  fullWidth = false,
}: ButtonProps): React.JSX.Element => {
  const classNames = [
    'button',
    `button-${variant}`,
    `button-${size}`,
    fullWidth ? 'button-full-width' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classNames}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
